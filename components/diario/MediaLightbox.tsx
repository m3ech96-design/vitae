"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DiaryMedia } from "@/lib/diary-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { ColorVaporHalos } from "../ui/ColorVaporHalos";

export function MediaLightbox({ media, onClose }: { media: DiaryMedia; onClose: () => void }) {
  const imageUrl = useResolvedImage(media.type === "image" ? media.key : undefined);
  const videoUrl = useResolvedVideo(media.type === "video" ? media.key : undefined);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black" onClick={onClose}>
      <ColorVaporHalos />
      <button
        onClick={onClose}
        className="focus-ring glass-strong absolute right-4 top-[max(env(safe-area-inset-top),0.9rem)] z-20 flex h-9 w-9 items-center justify-center rounded-full text-ink-200"
        aria-label="Chiudi"
      >
        <X size={16} />
      </button>
      {media.type === "image" && imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="relative z-10 max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {media.type === "video" && videoUrl && (
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="relative z-10 max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>,
    document.body
  );
}
