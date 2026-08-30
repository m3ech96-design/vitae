"use client";
import { useState } from "react";
import { Plus, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ThumbItem } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeWords } from "@/lib/text";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

function Thumb({ imageKey, title }: { imageKey?: string; title: string }) {
  const resolvedUrl = useResolvedImage(imageKey);
  return resolvedUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolvedUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-ink-400">
      {title}
    </div>
  );
}

export function ThumbGridField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: ThumbItem[];
  onChange: (items: ThumbItem[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const reset = () => {
    setTitle("");
    setImage(undefined);
    setOpen(false);
  };

  const confirm = () => {
    if (!title.trim()) return;
    onChange([...items, { id: newId(), title: capitalizeWords(title.trim()), imageUrl: image }]);
    reset();
  };

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));


  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]"
            >
              {item.imageUrl ? (
                <Thumb imageKey={item.imageUrl} title={item.title} />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-ink-400">
                  {item.title}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void-950/90 to-transparent p-1.5">
                <p className="truncate text-[10px] text-ink-100">{item.title}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="focus-ring absolute right-1 top-1 rounded-full bg-void-950/70 p-1 text-ink-200 opacity-0 transition group-hover:opacity-100"
                aria-label="Rimuovi"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex aspect-square flex-col items-center justify-center gap-1 rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={18} />
          <span className="text-[10px]">Aggiungi</span>
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-3 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-4"
        >
          <TextField
            label="Titolo"
            placeholder={placeholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <ImageCropInput
            shape="square"
            onChange={(url) => setImage(url)}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="focus-ring flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-600 hover:text-ink-200"
              >
                <ImagePlus size={14} />
                {image ? "Miniatura selezionata (tocca per ricentrare)" : "Aggiungi Miniatura"}
              </button>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Annulla
            </Button>
            <Button size="sm" onClick={confirm} disabled={!title.trim()}>
              Aggiungi
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
