"use client";
import { useEffect, useState } from "react";

/**
 * Pattern comune ai tre hook use-resolved-{image,audio,video}: risolvere una chiave
 * IndexedDB in un URL visualizzabile/riproducibile, con cleanup che ignora una risoluzione
 * arrivata dopo che la chiave è già cambiata (`cancelled`).
 *
 * Non forza le tre varianti a essere identiche — non lo sono per una ragione tecnica reale:
 * le immagini sono salvate in IndexedDB già come stringa (data URL) pronta all'uso, mentre
 * audio e video sono salvati come Blob e richiedono `URL.createObjectURL` + revoca al
 * cleanup (un `<video>`/`<audio> src` con una data URI pesante non è affidabile su diversi
 * browser mobili — vedi use-resolved-video.ts e audio-store.ts). Questo hook accetta un
 * `toUrl` opzionale proprio per lasciare a chi lo usa la scelta di quale delle due strade
 * seguire, invece di appiattire una differenza che esiste per un motivo.
 */
export function useResolvedMedia<T>(
  key: string | undefined,
  resolve: (key: string) => Promise<T | undefined>,
  toUrl: (value: T) => { url: string; revoke?: () => void } = (value) => ({ url: value as unknown as string }),
  initial?: string
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(initial);

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    let revoke: (() => void) | undefined;
    resolve(key).then((value) => {
      if (cancelled || value === undefined) return;
      const resolved = toUrl(value);
      revoke = resolved.revoke;
      setUrl(resolved.url);
    });
    return () => {
      cancelled = true;
      revoke?.();
    };
  }, [key]);

  return url;
}
