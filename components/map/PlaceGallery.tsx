"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useResolvedImage } from "@/lib/use-resolved-image";

/** Foto a schermo intero, ingrandibile toccando la slide — stesso guscio a portal di
 * PersonalCardSheet/altri overlay dell'app (mai bloccato dentro un antenato con transform,
 * vedi il commento in PersonalCardSheet.tsx), ma senza il contenuto a foglio: qui serve
 * solo mostrare l'immagine intera, non un pannello con altro contenuto sotto. */
function PhotoLightbox({ photoKey, onClose }: { photoKey: string; onClose: () => void }) {
  const url = useResolvedImage(photoKey);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !url) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black" onClick={onClose}>
      <button
        onClick={onClose}
        className="focus-ring absolute right-4 top-[max(env(safe-area-inset-top),0.9rem)] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ink-100"
        aria-label="Chiudi"
      >
        <X size={16} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
}

/**
 * Una singola foto della galleria — risolta da IndexedDB come nel resto dell'app (vedi
 * use-resolved-image.ts). Finché non è pronta la card resta vuota invece di lampeggiare un
 * placeholder, esattamente come fa ProductPhoto in AnimalFoodSection.tsx.
 *
 * Corretto secondo le istruzioni: prima usava `object-cover` per riempire un'altezza fissa,
 * il che tagliava sistematicamente le foto non esattamente in quel rapporto d'aspetto (la
 * stragrande maggioranza) — ora `object-contain` mostra sempre l'immagine INTERA, mai
 * ritagliata, con lo sfondo scuro coerente col resto dell'interfaccia a riempire lo spazio
 * che avanza sopra/sotto. Ogni slide è anche toccabile per aprirla a schermo intero
 * (PhotoLightbox sopra), dato che una foto "intera ma piccola" a volte non basta.
 */
function GallerySlide({ photoKey, onOpen }: { photoKey: string; onOpen: () => void }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  return (
    <button onClick={onOpen} className="h-full w-full bg-black/40" aria-label="Ingrandisci foto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-contain" />
    </button>
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
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (photoKeys.length === 0) return null;
  return (
    <>
      <div
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl2 border border-white/[0.06]"
        style={{ height }}
      >
        {photoKeys.map((key) => (
          <div key={key} className="h-full w-full shrink-0 snap-center snap-always">
            <GallerySlide photoKey={key} onOpen={() => setOpenKey(key)} />
          </div>
        ))}
      </div>
      {openKey && <PhotoLightbox photoKey={openKey} onClose={() => setOpenKey(null)} />}
    </>
  );
}
