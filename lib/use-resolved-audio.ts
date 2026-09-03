"use client";
import { getAudioBlob } from "./audio-store";
import { useResolvedMedia } from "./use-resolved-media";

/** Risolve una chiave IndexedDB in un URL riproducibile a partire dal Blob salvato (vedi
 * audio-store.ts) — stesso pattern di use-resolved-video.ts, con la stessa necessità di
 * createObjectURL/revokeObjectURL invece di una data URL diretta, per la stessa ragione di
 * affidabilità su browser mobili con file più pesanti (vedi use-resolved-media.ts). */
export function useResolvedAudio(key: string | undefined): string | undefined {
  return useResolvedMedia(key, getAudioBlob, (blob) => {
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  });
}
