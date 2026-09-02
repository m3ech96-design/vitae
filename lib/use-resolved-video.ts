"use client";
import { useEffect, useState } from "react";
import { getVideoBlob } from "./video-store";

/** Risolve una chiave IndexedDB in un URL riproducibile. A differenza delle immagini, qui
 * serve un `URL.createObjectURL` sul Blob salvato (non una data URI): è la correzione del bug
 * per cui i video non venivano riprodotti — un `<video src>` con una data URI pesante non è
 * affidabile su diversi browser mobili, mentre un object URL su Blob funziona sempre. L'URL
 * creato viene revocato alla pulizia per non accumulare memoria a ogni apertura. */
export function useResolvedVideo(key: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    let objectUrl: string | undefined;
    getVideoBlob(key).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);

  return url;
}
