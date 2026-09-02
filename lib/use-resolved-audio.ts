"use client";
import { useEffect, useState } from "react";
import { getAudio } from "./audio-store";

/** Risolve una chiave IndexedDB in un URL riproducibile — stesso pattern di
 * use-resolved-image.ts e use-resolved-video.ts. */
export function useResolvedAudio(key: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    getAudio(key).then((v) => {
      if (!cancelled) setUrl(v);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return url;
}
