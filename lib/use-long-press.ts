"use client";
import { useRef, useCallback, useState } from "react";

const HOLD_MS = 550;
const CONFIRM_MS = 900;
/** Oltre questa distanza (px) il dito si sta muovendo, non tenendo premuto — annulla il
 * timer. Necessario da quando questo hook si è esteso a bersagli grandi quanto un'intera
 * pagina (premere a lungo sulla Home per aggiungere un widget): su un piccolo pulsante un
 * dito fermo non si sposta quasi mai per sbaglio, ma su tutta la pagina un normale scroll
 * comincia anch'esso con un dito che si posa — senza questo controllo, scorrere lentamente
 * avrebbe aperto il foglio widget a metà gesto. */
const MOVE_CANCEL_PX = 12;

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
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);
  const [justPressed, setJustPressed] = useState(false);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    startPos.current = null;
    setPressing(false);
  }, []);

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Ferma la propagazione fin dal pointerdown: da quando questo hook si usa anche
      // annidato (un widget con la propria pressione lunga dentro una pagina che ne ha
      // un'altra tutta sua, es. Home per "aggiungi widget"), senza questo un solo tocco
      // avvierebbe DUE timer insieme — quello del bersaglio preciso e quello di un
      // antenato — aprendo due fogli diversi alla fine dello stesso gesto.
      e.stopPropagation();
      firedRef.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
      setPressing(true);
      timer.current = setTimeout(() => {
        firedRef.current = true;
        setPressing(false);
        onLongPress();
        setJustPressed(true);
        setTimeout(() => setJustPressed(false), CONFIRM_MS);
      }, HOLD_MS);
    },
    [onLongPress]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!startPos.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancel();
    },
    [cancel]
  );

  return {
    pressing,
    justPressed,
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
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
