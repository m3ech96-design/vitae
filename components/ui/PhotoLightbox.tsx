"use client";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useResolvedImage } from "@/lib/use-resolved-image";

/**
 * Il visualizzatore foto unico di tutta l'app — prima ogni scheda (Hobby, Salute, Animali,
 * Mappa, Wishlist...) reinventava per conto proprio una minuscola anteprima statica, mai
 * ingrandibile: si vedeva un quadratino di 44-64px e basta, la foto vera non si poteva mai
 * davvero consultare. Corretto centralizzando la visualizzazione qui, con quello che una
 * foto merita: schermo intero, sfogliabile se ce n'è più di una, e zoom al doppio tocco per i
 * dettagli piccoli (una scritta su una confezione, un particolare su un pezzo da collezione).
 *
 * Sempre a partire da un array di photoKey (anche di un solo elemento) più un indice
 * iniziale — mai un singolo url isolato — così lo stesso componente serve sia un campo con
 * una foto sola sia una galleria vera, senza due implementazioni parallele da mantenere.
 */
function LightboxImage({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  const [zoomed, setZoomed] = useState(false);

  // Il doppio tocco è il gesto di zoom più affidabile da riconoscere senza una libreria di
  // gesture dedicata (il vero pizzico a due dita richiederebbe tracciare due puntatori
  // contemporaneamente, sproporzionato qui) — un tocco doppio è il gesto che chiunque prova
  // per primo istintivamente su una foto piccola, quindi è quello giusto da intercettare.
  const [lastTap, setLastTap] = useState(0);
  const onTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) setZoomed((z) => !z);
    setLastTap(now);
  }, [lastTap]);

  if (!url) {
    return <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white/5 text-xs text-ink-800">Caricamento...</div>;
  }

  return (
    <motion.div
      drag={zoomed}
      dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
      dragElastic={0.15}
      className="flex h-full w-full items-center justify-center overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onClick={onTap}
        className={`max-h-full max-w-full select-none object-contain transition-transform duration-300 ${zoomed ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in"}`}
        draggable={false}
      />
    </motion.div>
  );
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  onClose,
  onDelete,
}: {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
  /** Se presente, mostra un pulsante per rimuovere la foto attualmente a schermo — chi
   * chiama decide cosa significa "rimuovere" (dalla galleria di un luogo, da un blocco
   * hobby...), il lightbox stesso non tocca mai i dati da solo. */
  onDelete?: (photoKey: string, index: number) => void;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  if (!mounted || photos.length === 0) return null;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (photos.length < 2) return;
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
  };

  const current = photos[index];

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-black" onClick={onClose}>
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.9rem)]">
        <p className="text-xs text-ink-400">{photos.length > 1 ? `${index + 1} di ${photos.length}` : ""}</p>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(current, index);
                if (photos.length <= 1) onClose();
                else setIndex((i) => Math.min(i, photos.length - 2));
              }}
              className="focus-ring glass-strong flex h-9 w-9 items-center justify-center rounded-full text-aura-pink"
              aria-label="Elimina foto"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="focus-ring glass-strong flex h-9 w-9 items-center justify-center rounded-full text-ink-200"
            aria-label="Chiudi"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <motion.div
        className="relative flex-1"
        drag={photos.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={onDragEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            <LightboxImage photoKey={current} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="focus-ring glass-strong absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-200"
            aria-label="Foto precedente"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="focus-ring glass-strong absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-200"
            aria-label="Foto successiva"
          >
            <ChevronRight size={18} />
          </button>
          <div className="flex shrink-0 justify-center gap-1.5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-ink-100" : "w-1.5 bg-ink-800"}`} />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
