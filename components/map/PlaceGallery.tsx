"use client";
import { useResolvedImage } from "@/lib/use-resolved-image";

/**
 * Una singola foto della galleria — risolta da IndexedDB come nel resto dell'app (vedi
 * use-resolved-image.ts). Finché non è pronta la card resta vuota invece di lampeggiare un
 * placeholder, esattamente come fa ProductPhoto in AnimalFoodSection.tsx.
 */
function GallerySlide({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-full w-full object-cover" />
  );
}

/**
 * Galleria foto di un luogo — carosello a scorrimento orizzontale, una foto grande alla
 * volta, in stile "galleria foto" di Google Maps: non miniature, ogni slide occupa l'intera
 * larghezza del contenitore. `scroll-snap` aggancia la foto più vicina al bordo dopo ogni
 * scorrimento, così il dito non lascia mai la vista a metà tra due immagini — nessun
 * JavaScript per il paging, il browser gestisce da solo lo snap e l'inerzia touch.
 * Nessun limite al numero di foto (vedi Place.photoKeys in lib/types.ts): la scrollbar
 * orizzontale nascosta permette di scorrerle tutte comunque siano.
 */
export function PlaceGallery({ photoKeys, height = 176 }: { photoKeys: string[]; height?: number }) {
  if (photoKeys.length === 0) return null;
  return (
    <div
      className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      style={{ height }}
    >
      {photoKeys.map((key) => (
        <div key={key} className="h-full w-full shrink-0 snap-center snap-always">
          <GallerySlide photoKey={key} />
        </div>
      ))}
    </div>
  );
}
