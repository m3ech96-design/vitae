"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

interface PanZoomOptions {
  minScale?: number;
  maxScale?: number;
  initial?: PanZoomState;
}

/**
 * Pan + zoom a Pointer Events, sulla stessa tecnica già in uso in ImageViewer.tsx e
 * StoryViewer.tsx (una Map di puntatori attivi, distanza tra due dita per il pizzico) — qui
 * estesa con il trascinamento a un dito, che i visualizzatori immagine non usano perché non
 * serve loro spostare l'immagine, solo ingrandirla. Stessa sensazione "come una mappa"
 * richiesta per l'Albero: pizzico per lo zoom, trascinamento con un dito per spostarsi.
 *
 * Lo zoom (sia a due dita sia con la rotellina/trackpad) resta ancorato al punto toccato o
 * sotto il cursore — non ricentra tutto sull'origine, altrimenti pizzicare un angolo
 * dell'albero farebbe scattare la vista altrove invece di ingrandire lì dove si è toccato.
 */
export function usePanZoom(containerRef: React.RefObject<HTMLElement>, options: PanZoomOptions = {}) {
  const minScale = options.minScale ?? 0.25;
  const maxScale = options.maxScale ?? 2.5;
  const [state, setState] = useState<PanZoomState>(options.initial ?? { scale: 1, x: 0, y: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ clientX: number; clientY: number; originX: number; originY: number } | null>(null);
  /** true appena il gesto supera una soglia minima di movimento — distingue un tocco (per
   * aprire una card) da un trascinamento vero, così un tap non sposta la vista per un
   * tremolio impercettibile del dito. */
  const didDrag = useRef(false);

  const relativePoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
    },
    [containerRef]
  );

  const clampScale = useCallback((s: number) => Math.min(maxScale, Math.max(minScale, s)), [minScale, maxScale]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      didDrag.current = false;
      dragStart.current = { clientX: e.clientX, clientY: e.clientY, originX: stateRef.current.x, originY: stateRef.current.y };
    } else if (pointers.current.size === 2) {
      dragStart.current = null; // due dita: da qui in poi è un pizzico, non un trascinamento
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: stateRef.current.scale };
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2 && pinchStart.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const nextScale = clampScale(pinchStart.current.scale * (dist / pinchStart.current.dist));
        const mid = relativePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        setState((prev) => {
          // Il punto del mondo sotto il centro del pizzico resta lì — vedi la nota in cima
          // al file: senza questo conto, il pizzico farebbe scattare la vista invece di
          // ingrandire dove si è davvero toccato.
          const worldX = (mid.x - prev.x) / prev.scale;
          const worldY = (mid.y - prev.y) / prev.scale;
          return { scale: nextScale, x: mid.x - worldX * nextScale, y: mid.y - worldY * nextScale };
        });
        didDrag.current = true;
        return;
      }

      if (pointers.current.size === 1 && dragStart.current) {
        const dx = e.clientX - dragStart.current.clientX;
        const dy = e.clientY - dragStart.current.clientY;
        if (Math.hypot(dx, dy) > 4) didDrag.current = true;
        setState((prev) => ({ ...prev, x: dragStart.current!.originX + dx, y: dragStart.current!.originY + dy }));
      }
    },
    [clampScale, relativePoint]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  }, []);

  /**
   * Corretto secondo le istruzioni: React collega gli eventi `wheel` (come `touchmove`) alla
   * radice in modo sempre passivo dalla versione 17 in poi, per non rallentare lo scroll della
   * pagina — una prop `onWheel` che chiama `preventDefault()` viene quindi ignorata in
   * silenzio (solo un avviso in console, "Unable to preventDefault inside passive event
   * listener invocation"), e lo zoom a rotellina finiva per scorrere la pagina sotto invece di
   * ingrandire l'albero. L'unico modo per farlo funzionare davvero è agganciare l'ascoltatore
   * a mano con `{ passive: false }`, fuori dal sistema di eventi sintetici di React.
   */
  const onWheelRef = useRef<(e: WheelEvent) => void>();
  onWheelRef.current = (e: WheelEvent) => {
    e.preventDefault();
    const point = relativePoint(e.clientX, e.clientY);
    setState((prev) => {
      const nextScale = clampScale(prev.scale * (1 - e.deltaY * 0.0015));
      const worldX = (point.x - prev.x) / prev.scale;
      const worldY = (point.y - prev.y) / prev.scale;
      return { scale: nextScale, x: point.x - worldX * nextScale, y: point.y - worldY * nextScale };
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const listener = (e: WheelEvent) => onWheelRef.current?.(e);
    el.addEventListener("wheel", listener, { passive: false });
    return () => el.removeEventListener("wheel", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  /** Centra la vista su un punto del "mondo" (stesse unità del contenuto interno, non
   * pixel schermo) — usata dal pulsante "centra sulla persona di riferimento". */
  const centerOn = useCallback(
    (worldX: number, worldY: number, scale?: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = (rect?.width ?? 0) / 2;
      const cy = (rect?.height ?? 0) / 2;
      setState((prev) => {
        const s = scale ?? prev.scale;
        return { scale: s, x: cx - worldX * s, y: cy - worldY * s };
      });
    },
    [containerRef]
  );

  /** Inquadra un intero rettangolo del "mondo" (usata all'apertura e dal pulsante "torna allo
   * zoom iniziale") — sceglie lo zoom più grande che ci fa comunque stare tutto, con un
   * margine, mai oltre maxScale. */
  const fitBounds = useCallback(
    (minX: number, maxX: number, minY: number, maxY: number, padding = 80) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const viewW = (rect?.width ?? 1) - padding * 2;
      const viewH = (rect?.height ?? 1) - padding * 2;
      const contentW = Math.max(1, maxX - minX);
      const contentH = Math.max(1, maxY - minY);
      const s = clampScale(Math.min(viewW / contentW, viewH / contentH));
      const worldCx = (minX + maxX) / 2;
      const worldCy = (minY + maxY) / 2;
      centerOn(worldCx, worldCy, s);
    },
    [containerRef, clampScale, centerOn]
  );

  return {
    state,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    centerOn,
    fitBounds,
    /** true se l'ultimo gesto è stato un trascinamento/pizzico vero, non solo un tocco — un
     * tap sulla card di una persona deve controllare questo prima di aprirsi, altrimenti
     * finirebbe per aprirsi anche a fine trascinamento. */
    didDragRef: didDrag,
  };
}
