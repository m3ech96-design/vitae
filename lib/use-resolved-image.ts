"use client";
import { useEffect, useState } from "react";
import { getImage, isDataUrl } from "./image-store";

/** Risolve una chiave IndexedDB in un URL visualizzabile. Se riceve una vecchia data URL
 * diretta, la usa così com'è, sia come stato iniziale sia nell'effetto — evita una chiamata
 * asincrona a getImage del tutto inutile per quel caso. Non condivide l'implementazione con
 * use-resolved-audio.ts/use-resolved-video.ts (vedi use-resolved-media.ts): quel corto
 * circuito sincrono è specifico di questo hook, forzarlo nell'astrazione comune l'avrebbe
 * resa più contorta di quanto valesse la pena. */
export function useResolvedImage(key: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(isDataUrl(key) ? key : undefined);

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      return;
    }
    if (isDataUrl(key)) {
      setUrl(key);
      return;
    }
    let cancelled = false;
    getImage(key).then((v) => {
      if (!cancelled) setUrl(v);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return url;
}
