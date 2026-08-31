"use client";
import { useRef, useCallback, useState } from "react";

const HOLD_MS = 550;
const CONFIRM_MS = 900;

/**
 * Un tocco lungo, mai un pulsante extra sparso ovunque: lo stesso identico gesto con cui
 * si preme davvero un fiore tra le pagine di un libro. `pressing` è un accenno di
 * compressione durante l'attesa, `justPressed` una breve conferma dopo — nessuna delle due
 * è richiesta per usare l'hook, sono solo per il riscontro visivo. Funziona sia a dito
 * (mobile) sia col mouse (desktop), senza duplicare la logica.
 */
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const [pressing, setPressing] = useState(false);
  const [justPressed, setJustPressed] = useState(false);

  const start = useCallback(() => {
    firedRef.current = false;
    setPressing(true);
    timer.current = setTimeout(() => {
      firedRef.current = true;
      setPressing(false);
      onLongPress();
      setJustPressed(true);
      setTimeout(() => setJustPressed(false), CONFIRM_MS);
    }, HOLD_MS);
  }, [onLongPress]);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPressing(false);
  }, []);

  return {
    pressing,
    justPressed,
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      // Evita che un tocco lungo, una volta scattato, apra ANCHE il click normale sotto
      // (che altrimenti partirebbe comunque al rilascio del dito).
      onClickCapture: (e: React.MouseEvent) => {
        if (firedRef.current) {
          e.preventDefault();
          e.stopPropagation();
          firedRef.current = false;
        }
      },
    },
  };
}
