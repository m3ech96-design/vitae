"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { PhotoLightbox } from "./PhotoLightbox";

const AUTO_ADVANCE_MS = 4000;
const RESUME_AFTER_MS = 5000;

/**
 * Una singola foto della galleria — risolta da IndexedDB come nel resto dell'app (vedi
 * use-resolved-image.ts). Finché non è pronta la card resta vuota invece di lampeggiare un
 * placeholder, esattamente come fa ProductPhoto in AnimalFoodSection.tsx.
 *
 * `object-contain` mostra sempre l'immagine INTERA, mai ritagliata, con lo sfondo scuro
 * coerente col resto dell'interfaccia a riempire lo spazio che avanza sopra/sotto. Ogni
 * slide è toccabile per aprirla nel visualizzatore condiviso (PhotoLightbox), che qui
 * riceve l'intera galleria — sfogliabile a schermo intero, non solo la singola foto toccata.
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
 * Galleria foto generica — carosello a scorrimento orizzontale, una foto grande alla volta,
 * in stile "galleria foto" di Google Maps: non miniature, ogni slide occupa l'intera
 * larghezza del contenitore. `scroll-snap` aggancia la foto più vicina al bordo dopo ogni
 * scorrimento, così il dito non lascia mai la vista a metà tra due immagini — nessun
 * JavaScript per il paging, il browser gestisce da solo lo snap e l'inerzia touch.
 * Nessun limite al numero di foto: la scrollbar orizzontale nascosta permette di scorrerle
 * tutte comunque siano. Con una sola foto funziona altrettanto bene come vetrina singola
 * "mostrata per intero, mai ritagliata" — non serve un componente separato per quel caso.
 *
 * Estratta da PlaceGallery.tsx (Mappa) perché lo stesso bisogno — mostrare una o più foto
 * per intero invece che ritagliate in un quadratino, con tocco per ingrandire — ricorre
 * anche fuori dalla Mappa (Libreria, Inventario, Progetti, Partite in Hobby...): un solo
 * componente condiviso, non una copia locale ogni volta.
 */
export function PhotoGallery({
  photoKeys,
  height = 176,
  bordered = true,
  autoScroll = false,
}: {
  photoKeys: string[];
  height?: number;
  /** Di norma true (bordo + angoli propri) — pensato per stare dentro un corpo scorrevole
   * come una card a sé (es. la sezione "Foto" nella finestra di un luogo). Un header a tutta
   * larghezza in cima a un foglio (vedi ItemDetailSheet) è un contesto diverso: lì il bordo/
   * arrotondamento proprio creerebbe una foto "incorniciata" e rimpicciolita invece che a
   * tutta larghezza — l'header deve restare a filo, lasciando che sia il foglio esterno
   * (`overflow-hidden rounded-t-xl3`) a tagliare gli angoli, esattamente come fa già
   * l'header di PlaceWindow. */
  bordered?: boolean;
  /** Richiesto per l'header della finestra di un luogo: avanza da solo alla foto successiva
   * ogni pochi secondi (se ce n'è più di una), con una transizione dolce, mai a scatti — MA
   * lascia sempre spazio allo scorrimento manuale, fermandosi non appena l'utente tocca la
   * striscia e riprendendo solo dopo un po' di inattività. Falso di norma: le altre gallerie
   * (Libreria, Inventario...) restano ferme finché non è l'utente a scorrerle. */
  autoScroll?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distingue uno scroll causato da noi stessi (l'avanzamento automatico) da uno vero
  // dell'utente: senza, l'evento "scroll" generato dal nostro stesso scrollTo() verrebbe
  // scambiato per un'interazione manuale, mettendo in pausa l'avanzamento automatico non
  // appena tenta di muoversi da solo.
  const isAutoAdvancingRef = useRef(false);

  const scheduleResume = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setManuallyPaused(false), RESUME_AFTER_MS);
  }, []);

  const onManualScroll = useCallback(() => {
    if (isAutoAdvancingRef.current) return;
    setManuallyPaused(true);
    scheduleResume();
  }, [scheduleResume]);

  useEffect(() => () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }, []);

  // L'avanzamento vero e proprio — sospeso mentre l'utente ha appena scorso a mano
  // (manuallyPaused) o mentre una foto è aperta a schermo intero (openIndex), non solo
  // quando la galleria è a riposo.
  useEffect(() => {
    if (!autoScroll || photoKeys.length <= 1 || manuallyPaused || openIndex !== null) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const slideWidth = el.clientWidth;
      const atEnd = el.scrollLeft + slideWidth >= el.scrollWidth - 4;
      isAutoAdvancingRef.current = true;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + slideWidth, behavior: "smooth" });
      // Una transizione "smooth" nativa dura all'incirca mezzo secondo — passato quel tempo
      // lo scroll è certamente terminato, quindi un evento "scroll" successivo è di nuovo
      // sicuramente dell'utente.
      setTimeout(() => {
        isAutoAdvancingRef.current = false;
      }, 600);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [autoScroll, photoKeys.length, manuallyPaused, openIndex]);

  if (photoKeys.length === 0) return null;
  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onManualScroll}
        onPointerDown={onManualScroll}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth ${bordered ? "rounded-xl2 border border-white/[0.06]" : ""}`}
        style={{ height }}
      >
        {photoKeys.map((key, i) => (
          <div key={key} className="h-full w-full shrink-0 snap-center snap-always">
            <GallerySlide photoKey={key} onOpen={() => setOpenIndex(i)} />
          </div>
        ))}
      </div>
      {openIndex !== null && <PhotoLightbox photos={photoKeys} initialIndex={openIndex} onClose={() => setOpenIndex(null)} />}
    </>
  );
}
