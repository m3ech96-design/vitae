"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { StatEntry } from "@/lib/hobby-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function StatEntryModal({
  hobbyId,
  blockId,
  entry,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  entry?: StatEntry;
  onClose: () => void;
}) {
  const { addStatEntry, updateStatEntry, removeStatEntry } = useHobby();

  const [name, setName] = useState(entry?.name ?? "");
  const [value, setValue] = useState(entry ? String(entry.value) : "0");
  const [min, setMin] = useState(entry ? String(entry.min) : "0");
  const [max, setMax] = useState(entry?.max !== undefined ? String(entry.max) : "");
  const [step, setStep] = useState(entry ? String(entry.step) : "1");

  const canSave = name.trim().length > 0 && !Number.isNaN(parseFloat(value)) && !Number.isNaN(parseFloat(min));

  const submit = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      value: parseFloat(value),
      min: parseFloat(min),
      max: max.trim() ? parseFloat(max) : undefined,
      step: Math.max(0.01, parseFloat(step) || 1),
      color: entry?.color,
    };
    if (entry) updateStatEntry(hobbyId, blockId, entry.id, payload);
    else addStatEntry(hobbyId, blockId, payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{entry ? "Modifica statistica" : "Nuova statistica"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Furtività, Distruzione, Eloquenza..." autoFocus />

          <TextField label="Valore attuale" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Minimo" type="number" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
            <TextField label="Massimo (facoltativo)" type="number" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Nessun tetto" />
          </div>

          <TextField
            label="Incremento a tocco"
            type="number"
            inputMode="decimal"
            value={step}
            onChange={(e) => setStep(e.target.value)}
            hint="Di quanto si sposta il valore ogni volta che tocchi + o −"
          />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {entry && (
              <Button
                variant="danger"
                onClick={() => {
                  removeStatEntry(hobbyId, blockId, entry.id);
                  onClose();
                }}
                aria-label="Elimina"
              >
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
