"use client";
import { useEffect, useRef, useState } from "react";
import { getCachedVideoFrames } from "./video-thumbnail";

/**
 * Restituisce il fotogramma da mostrare in questo istante per una miniatura video "che
 * scorre", e un ref da agganciare all'elemento — un IntersectionObserver ferma il ciclo
 * quando la card esce dallo schermo (durante lo scroll di un diario lungo, decine di
 * miniature che campionano frame contemporaneamente in background sarebbero solo spreco di
 * batteria, non un effetto che si vede comunque).
 */
export function useVideoScrubPreview(videoUrl: string | undefined, enabled: boolean, frameCount = 4) {
  const [frames, setFrames] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !visible || !videoUrl) return;
    let cancelled = false;
    getCachedVideoFrames(videoUrl, frameCount).then((f) => {
      if (!cancelled) setFrames(f);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, visible, videoUrl, frameCount]);

  useEffect(() => {
    if (!enabled || !visible || frames.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), 650);
    return () => clearInterval(id);
  }, [enabled, visible, frames.length]);

  return { ref, currentFrame: frames[index], hasFrames: frames.length > 0 };
}
