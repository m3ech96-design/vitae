"use client";
import { useEffect, useState } from "react";

/**
 * L'altezza della tastiera virtuale quando è aperta (0 quando non c'è) — tramite
 * `window.visualViewport`, l'unica API che riflette davvero quanto spazio la tastiera
 * toglie: un elemento `position: fixed` da solo resta ancorato al viewport del LAYOUT, che
 * la tastiera non restringe, quindi finirebbe nascosto sotto di lei senza questo calcolo.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(gap)));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
