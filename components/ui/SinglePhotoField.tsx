"use client";
import { useState } from "react";
import { ImagePlus, Pencil, X } from "lucide-react";
import { ImageCropInput } from "./ImageCropInput";
import { PhotoThumb } from "./PhotoThumb";
import { PhotoLightbox } from "./PhotoLightbox";

/**
 * Campo per una foto singola (copertina di un elemento Libreria, foto di una partita...) —
 * sostituisce il pattern che ogni file ripeteva a modo proprio: un pulsante che, con foto già
 * presente, la usava come sola anteprima e RIAPRIVA SEMPRE il selettore al tocco — mai un modo
 * per limitarsi a guardarla. Qui il tocco sulla foto la apre a schermo intero (PhotoLightbox);
 * sostituirla o rimuoverla sono due piccoli pulsanti separati, sempre visibili sopra di essa.
 */
export function SinglePhotoField({
  photoKey,
  onChange,
  size = "lg",
  shape = "square",
}: {
  photoKey?: string;
  onChange: (key: string | undefined) => void;
  size?: "md" | "lg" | "xl";
  shape?: "round" | "square";
}) {
  const [viewing, setViewing] = useState(false);

  if (!photoKey) {
    return (
      <ImageCropInput
        shape={shape}
        onChange={(key) => onChange(key)}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className={`focus-ring flex ${size === "xl" ? "h-24 w-24" : size === "lg" ? "h-16 w-16" : "h-11 w-11"} items-center justify-center rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50`}
            aria-label="Aggiungi foto"
          >
            <ImagePlus size={16} />
          </button>
        )}
      />
    );
  }

  return (
    <div className="relative inline-block">
      <PhotoThumb photoKey={photoKey} size={size} rounded={shape === "round" ? "rounded-full" : "rounded-xl2"} onClick={() => setViewing(true)} />
      <ImageCropInput
        shape={shape}
        onChange={(key) => onChange(key)}
        trigger={(open) => (
          <button
            onClick={open}
            className="focus-ring absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-aura-gradient text-void-950"
            aria-label="Sostituisci foto"
          >
            <Pencil size={10} />
          </button>
        )}
      />
      <button
        onClick={() => onChange(undefined)}
        className="focus-ring absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-void-950/90 text-ink-100 border border-white/10"
        aria-label="Rimuovi foto"
      >
        <X size={10} />
      </button>

      {viewing && <PhotoLightbox photos={[photoKey]} onClose={() => setViewing(false)} onDelete={() => onChange(undefined)} />}
    </div>
  );
}
