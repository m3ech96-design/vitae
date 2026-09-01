"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { visibleLatoStatoLines } from "@/lib/vitaecom-lato-stato";

/**
 * Il "Lato Stato": il lato sinistro della cornice di un post, spezzato dal resto del bordo
 * (un piccolo distacco agli estremi, non congiunto agli angoli) e composto da una o più
 * linee di colore — una per stato d'animo, quelle con più persone vincono quando non c'è
 * più spazio (vedi lib/vitaecom-lato-stato.ts). Compare solo quando esiste almeno una quota
 * per la catena di questo post (una condivisione o una reazione): un post mai condiviso né
 * toccato da nessuna reazione resta con il suo bordo normale, invariato.
 *
 * Bug reale corretto: la striscia partiva rientrata di 2px rispetto al vero bordo sinistro
 * (un `pl-0.5` di troppo), mentre il contorno del post lo lasciava intero su quel lato — le
 * istruzioni chiedevano che il bordo si interrompesse proprio lì, sostituito esattamente da
 * questa striscia, non affiancato da essa un po' più dentro. Vedi PostCard.tsx per la
 * corrispondente interruzione del bordo (border-left rimosso).
 */
export function LatoStato({ chainRootId, highlightMoodId }: { chainRootId: string; highlightMoodId?: string | null }) {
  const { allMoods } = useMood();
  const { moodTallies } = useVitaecomSocial();
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(220);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height || 220);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lines = visibleLatoStatoLines(moodTallies[chainRootId], height);
  if (lines.length === 0) return null;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-y-0 left-0 z-10 flex flex-col py-2.5" style={{ width: 7 }}>
      <div className="flex h-full w-full flex-col gap-[3px]">
        {lines.map((line) => {
          const mood = allMoods.find((m) => m.id === line.moodId);
          const color = mood?.color ?? "#8B90A8";
          const lit = highlightMoodId === line.moodId;
          return (
            <div key={line.moodId} className="relative flex-1">
              <motion.button
                type="button"
                onClick={() => setOpenTooltip((v) => (v === line.moodId ? null : line.moodId))}
                animate={lit ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 1.4 }}
                className="lato-stato-line pointer-events-auto h-full w-full rounded-full"
                style={{
                  background: `linear-gradient(120deg, ${color}, #fff6, ${color})`,
                  boxShadow: `0 0 7px 1px ${color}cc, 0 0 2px ${color}`,
                }}
                aria-label={`${line.count} persone si sono sentite ${mood?.label ?? ""}`}
              />
              <AnimatePresence>
                {openTooltip === line.moodId && (
                  <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -6, scale: 0.94 }}
                    transition={{ duration: 0.15 }}
                    className="glass-strong pointer-events-auto absolute left-3 top-1/2 z-20 w-max max-w-[180px] -translate-y-1/2 rounded-xl2 px-3 py-2 text-[11px] text-ink-100"
                  >
                    {line.count} {line.count === 1 ? "persona si è sentita" : "persone si sono sentite"}{" "}
                    <span style={{ color }}>{mood?.label ?? ""}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
