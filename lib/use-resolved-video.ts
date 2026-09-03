"use client";
import { getVideoBlob } from "./video-store";
import { useResolvedMedia } from "./use-resolved-media";

/** Risolve una chiave IndexedDB in un URL riproducibile. A differenza delle immagini/audio,
 * qui serve un `URL.createObjectURL` sul Blob salvato (non una data URI): è la correzione del
 * bug per cui i video non venivano riprodotti — un `<video src>` con una data URI pesante non
 * è affidabile su diversi browser mobili, mentre un object URL su Blob funziona sempre.
 * L'URL creato viene revocato alla pulizia (vedi use-resolved-media.ts) per non accumulare
 * memoria a ogni apertura. */
export function useResolvedVideo(key: string | undefined): string | undefined {
  return useResolvedMedia(key, getVideoBlob, (blob) => {
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  });
}
