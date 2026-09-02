"use client";
import { useState } from "react";
import { X, Trash2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { usePlaces } from "@/lib/places-context";
import { MetricBlock, MetricEntry } from "@/lib/hobby-types";
import { todayIso } from "@/lib/date-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

function PhotoPreview({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function MetricEntryModal({
  hobbyId,
  block,
  entry,
  onClose,
}: {
  hobbyId: string;
  block: MetricBlock;
  entry?: MetricEntry;
  onClose: () => void;
}) {
  const { addMetricEntry, updateMetricEntry, removeMetricEntry } = useHobby();
  const { places } = usePlaces();

  const [date, setDate] = useState(entry?.date ?? todayIso());
  const [value, setValue] = useState(entry ? String(entry.value) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [placeId, setPlaceId] = useState(entry?.placeId ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(entry?.photoKey);

  const canSave = value.trim().length > 0 && !Number.isNaN(parseFloat(value.replace(",", ".")));

  const submit = () => {
    if (!canSave) return;
    const payload = { date, value: parseFloat(value.replace(",", ".")), note: note.trim() || undefined, placeId: placeId || undefined, photoKey };
    if (entry) updateMetricEntry(hobbyId, block.id, entry.id, payload);
    else addMetricEntry(hobbyId, block.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{entry ? "Modifica voce" : `Nuova voce · ${block.title}`}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
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

          <ImageCropInput
            shape="square"
            onChange={(key) => setPhotoKey(key)}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="focus-ring flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 hover:border-aura-violet/50"
                aria-label="Foto"
              >
                {photoKey ? <PhotoPreview photoKey={photoKey} /> : <ImagePlus size={16} />}
              </button>
            )}
          />
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
    </div>
  );
}
