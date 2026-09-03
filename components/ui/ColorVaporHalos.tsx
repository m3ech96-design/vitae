"use client";
import { useMemo } from "react";

/**
 * Palette "vapori di colore" ispirata alla stagione Inverno dell'armocromia (fredda, scura e
 * brillante — non pastello): blu elettrico e blu notte, verde smeraldo, indaco/ametista,
 * fucsia, rosso rubino, bordeaux, ciano intenso e un accento di giallo limone. Sostituisce la
 * vecchia palette "ghiaccio" (tonalità quasi bianche) che sfumata sopra il nero leggeva come
 * una semplice foschia bianca, non come colore reale.
 */
const WINTER_VAPOR_PALETTE = [
  "#0B3DFF", // blu elettrico
  "#0A1554", // blu notte
  "#00875A", // verde smeraldo
  "#5B21B6", // indaco / ametista
  "#D6127B", // fucsia
  "#C8102E", // rosso rubino
  "#6E0D25", // bordeaux
  "#00B4C6", // ciano freddo intenso
  "#F4E409", // giallo limone (accento, usato di rado)
];

type Edge = "top" | "bottom" | "left" | "right";
const EDGES: Edge[] = ["top", "bottom", "left", "right"];

interface Vapor {
  id: string;
  edge: Edge;
  offsetPct: number;
  inset: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
  peak: number;
}

/** Genera i vapori proceduralmente (posizione, fase, velocità e picco di opacità leggermente
 * irregolari per ognuno) invece di scriverli a mano uno per uno, così il movimento non sembra
 * un pattern che si ripete a specchio. Ogni figura resta confinata a una fascia stretta vicino
 * al proprio bordo — mai sopra il contenuto al centro. */
function buildVapors(perEdge: number): Vapor[] {
  const vapors: Vapor[] = [];
  let seed = 0;
  for (const edge of EDGES) {
    for (let i = 0; i < perEdge; i++) {
      seed++;
      vapors.push({
        id: `${edge}-${i}`,
        edge,
        offsetPct: (i / perEdge) * 100 + ((seed * 13) % 11),
        inset: -8 + ((seed * 7) % 10),
        size: 22 + ((seed * 5) % 16),
        color: WINTER_VAPOR_PALETTE[seed % WINTER_VAPOR_PALETTE.length],
        duration: 13 + ((seed * 3) % 14),
        // Ritardo negativo: l'animazione parte come se fosse già a metà del suo ciclo, invece
        // di far apparire tutti i vapori insieme dal nulla al primo caricamento.
        delay: -((seed * 2.7) % 20),
        drift: seed % 2 === 0 ? 14 + (seed % 6) : -(14 + (seed % 6)),
        peak: 0.22 + ((seed % 5) * 0.03),
      });
    }
  }
  return vapors;
}

/**
 * Aloni di colore sfumati lungo i quattro margini che si mescolano tra loro come vapore — da
 * usare in ogni visualizzazione immagine a schermo intero dell'app (Vitaecom, Storie, Diario),
 * non solo in una. Animazione in puro CSS (`@keyframes` + `animation-iteration-count:
 * infinite`), non guidata da JavaScript: un loop `Infinity` su un motore di animazione JS può
 * fermarsi o saltare quando il browser sospende a lungo i timer (schermo bloccato, scheda in
 * background) — il difetto per cui l'animazione spariva dopo un po'. Un `@keyframes` CSS
 * riprende sempre da solo. Ogni alone segue un ciclo completo trasparenza → visibilità →
 * movimento → trasparenza (mai un'apparizione di colpo, come un pop-up), con durata e ritardo
 * propri: la miscela risulta continua perché i vapori non sono mai tutti sulla stessa fase.
 */
export function ColorVaporHalos({ perEdge = 7 }: { perEdge?: number }) {
  const vapors = useMemo(() => buildVapors(perEdge), [perEdge]);

  const keyframes = vapors
    .map((v) => {
      const horizontal = v.edge === "top" || v.edge === "bottom";
      const axis = horizontal ? "X" : "Y";
      const base = horizontal ? "translateX(-50%)" : "translateY(-50%)";
      return `@keyframes vitae-vapor-${v.id} {
        0% { opacity: 0; transform: ${base}; }
        30% { opacity: ${v.peak}; }
        50% { transform: ${base} translate${axis}(${v.drift}vh); }
        70% { opacity: ${v.peak}; }
        100% { opacity: 0; transform: ${base}; }
      }`;
    })
    .join("\n");

  return (
    // z-0 esplicito (non il semplice ordine nel DOM): chi mostra un'immagine sopra questo
    // componente deve solo impilarsi con uno z-index maggiore di 0, senza contare sul fatto
    // di venire dopo nel markup — un ancoraggio esplicito, non implicito, a garanzia che
    // "l'immagine sia sempre sovrapposta ai vapori", come richiesto.
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <style>{keyframes}</style>
      {vapors.map((v) => {
        const horizontal = v.edge === "top" || v.edge === "bottom";
        const style: React.CSSProperties = {
          position: "absolute",
          width: `${v.size}vh`,
          height: `${v.size}vh`,
          background: v.color,
          borderRadius: "9999px",
          animation: `vitae-vapor-${v.id} ${v.duration}s ease-in-out infinite`,
          animationDelay: `${v.delay}s`,
        };
        if (horizontal) {
          style.left = `${v.offsetPct}%`;
          style[v.edge] = `${v.inset}vh`;
        } else {
          style.top = `${v.offsetPct}%`;
          style[v.edge] = `${v.inset}vw`;
        }
        return <div key={v.id} className="absolute rounded-full blur-[75px]" style={style} />;
      })}
    </div>
  );
}
