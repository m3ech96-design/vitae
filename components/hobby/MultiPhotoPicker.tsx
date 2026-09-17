"use client";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PhotoThumb } from "../ui/PhotoThumb";
import { PhotoLightbox } from "../ui/PhotoLightbox";

/**
 * Corretto secondo le istruzioni: prima le miniature (64px) non erano cliccabili — l'unico
 * modo per vedere una foto inserita qui era ricordarsela a memoria, dato che restava troppo
 * piccola per essere consultata davvero. Ora un tocco apre PhotoLightbox a schermo intero,
 * sfogliabile tra tutte le foto già aggiunte qui, con zoom al doppio tocco per i dettagli.
 */
export function MultiPhotoPicker({ photoKeys, onChange, label }: { photoKeys: string[]; onChange: (keys: string[]) => void; label?: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div>
      {label && <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {photoKeys.map((k, i) => (
          <div key={k} className="relative">
            <PhotoThumb photoKey={k} size="lg" onClick={() => setLightboxIndex(i)} />
            <button
              onClick={() => onChange(photoKeys.filter((x) => x !== k))}
              className="focus-ring absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-void-950/80 text-ink-100"
              aria-label="Rimuovi foto"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <ImageCropInput
          shape="square"
          allowFreeAspect
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

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoKeys}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(key) => onChange(photoKeys.filter((x) => x !== key))}
        />
      )}
    </div>
  );
}
