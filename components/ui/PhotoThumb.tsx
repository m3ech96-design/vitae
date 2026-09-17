"use client";
import { ImageIcon } from "lucide-react";
import { useResolvedImage } from "@/lib/use-resolved-image";

const SIZE_CLASSES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

/**
 * Copertina/anteprima di una foto per una card o una riga di elenco — sostituisce le tante
 * versioni locali quasi identiche sparse per l'app (ItemThumb, CoverPreview, PhotoPreview,
 * CoverThumb...), ognuna con una dimensione e un fallback leggermente diversi (spesso
 * nessun fallback affatto: senza foto, un riquadro vuoto senza alcun indizio che lì potrebbe
 * starci un'immagine). Qui il fallback è sempre la stessa icona coerente, e il tocco per
 * aprire il visualizzatore a schermo intero (vedi PhotoLightbox) è integrato di serie, non
 * lasciato a chi lo usa da aggiungere caso per caso.
 */
export function PhotoThumb({
  photoKey,
  size = "md",
  rounded = "rounded-xl2",
  onClick,
}: {
  photoKey: string | undefined;
  size?: keyof typeof SIZE_CLASSES;
  rounded?: string;
  /** Se assente, la miniatura non è cliccabile (usata solo come indicatore visivo). */
  onClick?: () => void;
}) {
  const url = useResolvedImage(photoKey);
  const sizeClass = SIZE_CLASSES[size];

  const content = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${sizeClass} ${rounded} object-cover`} />
  ) : (
    <div className={`flex ${sizeClass} ${rounded} items-center justify-center border border-dashed border-white/10 bg-white/[0.03] text-ink-800`}>
      <ImageIcon size={size === "sm" ? 12 : size === "xl" ? 22 : 15} />
    </div>
  );

  if (!onClick) return <div className="shrink-0">{content}</div>;

  return (
    <button type="button" onClick={onClick} className="focus-ring shrink-0 overflow-hidden" aria-label="Vedi foto">
      {content}
    </button>
  );
}
