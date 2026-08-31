"use client";
import { useEffect, useState } from "react";
import { getVideo } from "./video-store";

/** Risolve una chiave IndexedDB in un URL riproducibile — stesso pattern di
 * use-resolved-image.ts. */
export function useResolvedVideo(key: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    getVideo(key).then((v) => {
      if (!cancelled) setUrl(v);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return url;
}
