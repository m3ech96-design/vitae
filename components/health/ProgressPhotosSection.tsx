"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PhotoLightbox } from "../ui/PhotoLightbox";

/** A differenza di PhotoThumb (dimensioni fisse, pensato per icone di riga), questa cella
 * deve riempire per intero uno spazio di griglia a larghezza variabile — da qui una versione
 * locale invece di forzare PhotoThumb in un uso per cui non è stato pensato. */
function GridPhoto({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="h-full w-full animate-pulse rounded-lg bg-white/[0.03]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />;
}

/**
 * Una foto periodica, in sequenza temporale — la stessa idea del diario fotografico
 * pensato per la scheda Diario, qui applicata al percorso fisico. Ordinate dalla più
 * recente, come uno scorrimento nel tempo.
 *
 * Corretto secondo le istruzioni: il tocco su una foto apriva un foglio con quella foto sola,
 * a tutta larghezza ma isolata — per una sequenza di foto di progresso, poterle scorrere
 * l'una dopo l'altra (per confrontare a occhio come cambia nel tempo) è più utile che
 * doverle riaprire una alla volta dalla griglia: ora apre la stessa galleria di
 * PhotoLightbox già usata ovunque nell'app, qui con tutte le foto di progresso in fila.
 */
export function ProgressPhotosSection() {
  const { progressPhotos, addProgressPhoto, removeProgressPhoto } = useHealth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const sorted = [...progressPhotos].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        <ImageCropInput
          shape="square"
          onChange={(dataUrl) => addProgressPhoto({ photoKey: dataUrl, date: todayIso() })}
          trigger={(openPicker) => (
            <button
              onClick={openPicker}
              className="focus-ring flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
            >
              <Camera size={16} />
              <span className="text-[9px]">Nuova foto</span>
            </button>
          )}
        />
        {sorted.map((p, i) => (
          <div key={p.id} className="relative">
            <button onClick={() => setOpenIndex(i)} className="focus-ring block aspect-square w-full overflow-hidden rounded-lg">
              <GridPhoto photoKey={p.photoKey} />
            </button>
            <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-void-950/70 px-1.5 py-0.5 text-[9px] text-ink-300">
              {formatDateShort(p.date)}
            </span>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <PhotoLightbox
          photos={sorted.map((p) => p.photoKey)}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          onDelete={(_key, i) => removeProgressPhoto(sorted[i].id)}
        />
      )}
    </div>
  );
}
