"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { DiaryMedia } from "@/lib/diary-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { ColorVaporHalos } from "../ui/ColorVaporHalos";

function LightboxSlide({ media }: { media: DiaryMedia }) {
  const imageUrl = useResolvedImage(media.type === "image" ? media.key : undefined);
  const videoUrl = useResolvedVideo(media.type === "video" ? media.key : undefined);

  if (media.type === "image" && imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="relative z-10 max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />;
  }
  if (media.type === "video" && videoUrl) {
    return (
      <video src={videoUrl} controls autoPlay playsInline className="relative z-10 max-h-full max-w-full" onClick={(e) => e.stopPropagation()} />
    );
  }
  return null;
}

/**
 * Corretto secondo le istruzioni: mostrava un solo media alla volta, senza modo di
 * scorrere agli altri della stessa voce di diario senza chiudere e riaprire da un'altra
 * miniatura — ora riceve l'intera galleria della voce (foto e video insieme, nell'ordine in
 * cui appaiono nella griglia) e si scorre come il visualizzatore foto usato nel resto
 * dell'app, con le stesse frecce/contatore/gesto di trascinamento.
 */
export function MediaLightbox({
  media,
  initialIndex = 0,
  onClose,
}: {
  media: DiaryMedia[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, media.length - 1));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + media.length) % media.length), [media.length]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % media.length), [media.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  if (!mounted || media.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black" onClick={onClose}>
      <ColorVaporHalos />
      <div className="absolute left-0 right-0 top-[max(env(safe-area-inset-top),0.9rem)] z-20 flex items-center justify-between px-4">
        <p className="text-xs text-ink-400">{media.length > 1 ? `${index + 1} di ${media.length}` : ""}</p>
        <button
          onClick={onClose}
          className="focus-ring glass-strong flex h-9 w-9 items-center justify-center rounded-full text-ink-200"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
      </div>

      <LightboxSlide media={media[index]} />

      {media.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="focus-ring glass-strong absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-200"
            aria-label="Precedente"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="focus-ring glass-strong absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-200"
            aria-label="Successivo"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
