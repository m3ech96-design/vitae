"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { usePlaces } from "@/lib/places-context";
import { useMood } from "@/lib/mood-context";
import { MetricBlock, MetricEntry } from "@/lib/hobby-types";
import { metricPersonalRecord } from "@/lib/hobby-stats";
import { todayIso } from "@/lib/date-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { SinglePhotoField } from "../ui/SinglePhotoField";
import { MetricTimer } from "./MetricTimer";

export function MetricEntryModal({
  hobbyId,
  hobbyName,
  block,
  entry,
  onClose,
}: {
  hobbyId: string;
  hobbyName: string;
  block: MetricBlock;
  entry?: MetricEntry;
  onClose: () => void;
}) {
  const { addMetricEntry, updateMetricEntry, removeMetricEntry } = useHobby();
  const { places } = usePlaces();
  const { fireTrigger } = useMood();

  const [date, setDate] = useState(entry?.date ?? todayIso());
  const [value, setValue] = useState(entry ? String(entry.value) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [placeId, setPlaceId] = useState(entry?.placeId ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(entry?.photoKey);

  const canSave = value.trim().length > 0 && !Number.isNaN(parseFloat(value.replace(",", ".")));

  const submit = () => {
    if (!canSave) return;
    const payload = { date, value: parseFloat(value.replace(",", ".")), note: note.trim() || undefined, placeId: placeId || undefined, photoKey };
    if (entry) {
      updateMetricEntry(hobbyId, block.id, entry.id, payload);
    } else {
      // Il record PRIMA di aggiungere la voce nuova — un solo dato in assoluto non "batte"
      // nulla, serve già un record da superare perché abbia senso festeggiarlo.
      const previousBest = metricPersonalRecord(block);
      const isNewRecord = previousBest
        ? block.direction === "crescente"
          ? payload.value > previousBest.value
          : payload.value < previousBest.value
        : false;
      addMetricEntry(hobbyId, block.id, payload);
      if (isNewRecord) fireTrigger("hobby:metrica-record");
    }
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{entry ? "Modifica voce" : `Nuova voce · ${block.title}`}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {block.isTimeBased && !entry && (
            <MetricTimer hobbyId={hobbyId} hobbyName={hobbyName} blockId={block.id} blockTitle={block.title} onFinish={(minutes) => setValue(String(minutes))} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label={`Valore (${block.unit || "unità"})`} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>

          <TextField label="Nota" value={note} onChange={(e) => setNote(e.target.value)} />

          <label className="block">
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Luogo</span>
            <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100">
              <option value="" className="bg-void-800">Nessuno</option>
              {places.map((p) => (
                <option key={p.id} value={p.id} className="bg-void-800">{p.name}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Foto</span>
            <SinglePhotoField photoKey={photoKey} onChange={setPhotoKey} />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {entry && (
              <Button variant="danger" onClick={() => { removeMetricEntry(hobbyId, block.id, entry.id); onClose(); }} aria-label="Elimina">
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
              {entry ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
