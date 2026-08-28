"use client";
import { useEffect, useState } from "react";
import { getImage, isDataUrl } from "./image-store";

/** Risolve una chiave IndexedDB in un URL visualizzabile. Se riceve una vecchia data URL diretta, la usa così com'è. */
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
