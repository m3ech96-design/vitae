"use client";
import { ImagePlus, X } from "lucide-react";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

function Thumb({ photoKey, onRemove }: { photoKey: string; onRemove: () => void }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl2 border border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        onClick={onRemove}
        className="focus-ring absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-void-950/80 text-ink-100"
        aria-label="Rimuovi foto"
      >
        <X size={10} />
      </button>
    </div>
  );
}

export function MultiPhotoPicker({ photoKeys, onChange, label }: { photoKeys: string[]; onChange: (keys: string[]) => void; label?: string }) {
  return (
    <div>
      {label && <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {photoKeys.map((k) => (
          <Thumb key={k} photoKey={k} onRemove={() => onChange(photoKeys.filter((x) => x !== k))} />
        ))}
        <ImageCropInput
          shape="square"
          onChange={(key) => onChange([...photoKeys, key])}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="focus-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50"
              aria-label="Aggiungi foto"
            >
              <ImagePlus size={16} />
            </button>
          )}
        />
      </div>
    </div>
  );
}
