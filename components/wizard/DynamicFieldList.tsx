"use client";
import { useState } from "react";
import { Plus, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CustomField } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeWords, capitalizeSentence } from "@/lib/text";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

function FieldThumb({ imageKey }: { imageKey: string }) {
  const resolvedUrl = useResolvedImage(imageKey);
  if (!resolvedUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolvedUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
  );
}

export function DynamicFieldList({
  fields,
  onChange,
  allowThumbnail = false,
  addLabel = "Aggiungi Campo",
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  allowThumbnail?: boolean;
  addLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [thumb, setThumb] = useState<string | undefined>(undefined);

  const reset = () => {
    setLabel("");
    setValue("");
    setThumb(undefined);
    setOpen(false);
  };

  const confirm = () => {
    if (!label.trim() || !value.trim()) return;
    onChange([
      ...fields,
      {
        id: newId(),
        label: capitalizeWords(label.trim()),
        value: capitalizeSentence(value.trim()),
        thumbnailUrl: thumb,
      },
    ]);
    reset();
  };

  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));


  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {fields.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="group flex items-center gap-3 rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            {f.thumbnailUrl && <FieldThumb imageKey={f.thumbnailUrl} />}
            <div className="min-w-0 flex-1">
              <p className="font-display text-[11px] uppercase tracking-[0.12em] text-ink-600">
                {f.label}
              </p>
              <p className="truncate text-sm text-ink-100">{f.value}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="focus-ring shrink-0 rounded-full p-1.5 text-ink-800 opacity-0 transition hover:text-aura-pink group-hover:opacity-100"
              aria-label="Rimuovi campo"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3 text-sm text-ink-600 transition hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={16} /> {addLabel}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Nome del campo"
              placeholder="Es. Sport Preferito"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <TextField
              label="Risposta"
              placeholder="Es. Nuoto"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {allowThumbnail && (
            <ImageCropInput
              shape="square"
              onChange={(url) => setThumb(url)}
              trigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="focus-ring flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-600 hover:text-ink-200"
                >
                  <ImagePlus size={14} />
                  {thumb ? "Immagine selezionata (tocca per ricentrare)" : "Aggiungi Miniatura (Facoltativo)"}
                </button>
              )}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Annulla
            </Button>
            <Button size="sm" onClick={confirm} disabled={!label.trim() || !value.trim()}>
              Aggiungi
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
