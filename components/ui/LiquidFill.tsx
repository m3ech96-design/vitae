"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { wavePath } from "@/lib/liquid-wave";

/**
 * Il riempimento liquido del riquadro profilo — corretto secondo le istruzioni originali
 * (prima non c'era alcuna animazione, solo un blocco colorato a altezza fissa). Tre
 * caratteristiche richieste, tutte e tre presenti:
 * 1. Bollicine che si formano sul fondo e corrono in superficie scoppiando.
 * 2. Un'animazione ad onda in superficie — più larga mentre si scorre attivamente
 *    (`pulsing`), come quando si scuote un bicchiere d'acqua.
 * 3. Un gradiente che si mescola lentamente, spostando la propria posizione nel tempo.
 */
export function LiquidFill({ heightPct, moodColor, pulsing }: { heightPct: number; moodColor: string; pulsing: boolean }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        x: 6 + ((i * 13.7) % 88),
        size: 3 + ((i * 5) % 4),
        delay: (i * 0.45) % 3,
        duration: 2.4 + ((i * 0.6) % 2),
      })),
    []
  );

  const amplitude = pulsing ? 2.4 : 1.1;
  const wavePaths = useMemo(() => Array.from({ length: 9 }, (_, i) => wavePath(i / 8, amplitude)), [amplitude]);

  return (
    <div className="absolute inset-x-0 bottom-0 overflow-hidden transition-[height] duration-150" style={{ height: `${heightPct}%` }}>
      {/* Gradiente che si mescola: la posizione dello sfondo scorre lentamente avanti e
         indietro su un'area tre volte più grande del contenitore. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, ${moodColor}, #fff4, ${moodColor}dd, #fff3, ${moodColor})`,
          backgroundSize: "280% 280%",
        }}
        animate={{ backgroundPosition: ["0% 30%", "100% 70%", "20% 90%", "0% 30%"] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bollicine dal fondo alla superficie, una alla volta scoppiano sparendo. */}
      {bubbles.map((b) => (
        <motion.span
          key={b.id}
          className="absolute rounded-full bg-white/80"
          style={{ left: `${b.x}%`, width: b.size, height: b.size, bottom: 0 }}
          animate={{ bottom: ["0%", "96%"], opacity: [0, 0.9, 0.9, 0], scale: [0.5, 1, 1, 0.2] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: "easeOut", times: [0, 0.15, 0.85, 1] }}
        />
      ))}

      {/* La superficie ondulata — il fronte sopra il riempimento piatto, stessa opacità e
         colore così la giunzione resta invisibile. La fase cresce sempre nella stessa
         direzione (mai avanti-indietro): un'onda che scorre, non che oscilla sul posto. */}
      <svg className="absolute inset-x-0 -top-2 h-3 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
        <motion.path
          fill={moodColor}
          fillOpacity={0.6}
          animate={{ d: wavePaths }}
          transition={{ duration: pulsing ? 1.1 : 3.2, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}
