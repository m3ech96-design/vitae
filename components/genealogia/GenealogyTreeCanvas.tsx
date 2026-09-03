"use client";
import { useEffect, useMemo, useRef } from "react";
import { Locate, Maximize2 } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { computeGenealogyLayout } from "@/lib/genealogy-layout";
import { directRoleLabel } from "@/lib/genealogy-format";
import { usePanZoom } from "@/lib/use-pan-zoom";
import { GenealogyPersonCard } from "./GenealogyPersonCard";

const COLUMN_PX = 104;
const ROW_PX = 148;
const CARD_WIDTH = 92;

/** Colore e tratto della linea in base al ruolo grafico dei due estremi — solo un aiuto
 * visivo a distinguere legami di sangue, di coppia, fraterni e "altro" (zio, cugino...),
 * mai un'informazione aggiuntiva rispetto a quella già scritta sulla relazione.
 *
 * `isAdoptive` sovrascrive il tratteggio (non il colore, che resta legato al ruolo) per
 * distinguere anche una relazione adottiva da una biologica, come richiesto — quella
 * biologica resta lo stile pieno di default, non serve marcarla a parte. */
function strokeFor(role: string, isAdoptive: boolean): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
  if (role === "partner") return { stroke: "#7C5CFF", strokeWidth: 2 };
  if (role === "sibling") return { stroke: "#565B77", strokeWidth: 2, strokeDasharray: isAdoptive ? "2 3" : "5 4" };
  if (role === "ascendant" || role === "descendant") {
    return { stroke: "#3A3F55", strokeWidth: 1.75, strokeDasharray: isAdoptive ? "3 3" : undefined };
  }
  return { stroke: "#3A3F55", strokeWidth: 1.25, strokeDasharray: "1.5 3.5" };
}

export function GenealogyTreeCanvas({
  referencePersonId,
  onOpenPerson,
}: {
  referencePersonId: string;
  onOpenPerson: (personId: string) => void;
}) {
  const { people, relationships, allTypes } = useGenealogy();
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(
    () => computeGenealogyLayout(referencePersonId, relationships, people, allTypes),
    [referencePersonId, relationships, people, allTypes]
  );
  const typesById = useMemo(() => new Map(allTypes.map((t) => [t.id, t])), [allTypes]);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const offsetX = -layout.minX;
  const offsetY = -layout.minGeneration;
  const worldWidth = Math.max(1, layout.maxX - layout.minX) * COLUMN_PX;
  const worldHeight = (layout.maxGeneration - layout.minGeneration + 1) * ROW_PX;

  const { state, handlers, centerOn, fitBounds, didDragRef } = usePanZoom(containerRef, { initial: { scale: 1, x: 0, y: 0 } });

  // All'apertura (o quando cambia la persona di riferimento) inquadra tutto l'albero — non
  // resta collassato in un angolo, e ripartire da capo dopo aver cambiato centro è meno
  // spiazzante che ritrovarsi con la vista di prima, ora riferita a qualcun altro.
  useEffect(() => {
    fitBounds(0, worldWidth, 0, worldHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencePersonId, worldWidth, worldHeight]);

  const positions = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    layout.nodes.forEach((n) => {
      map.set(n.personId, {
        cx: (n.x + offsetX + 0.5) * COLUMN_PX,
        cy: (n.generation + offsetY) * ROW_PX + ROW_PX / 2,
      });
    });
    return map;
  }, [layout.nodes, offsetX, offsetY]);

  const referencePos = positions.get(referencePersonId);

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none overflow-hidden" {...handlers}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: worldWidth, height: worldHeight, transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})` }}
      >
        <svg className="pointer-events-none absolute inset-0" width={worldWidth} height={worldHeight}>
          {layout.edges.map((e) => {
            const a = positions.get(e.personXId);
            const b = positions.get(e.personYId);
            if (!a || !b) return null;
            const style = strokeFor(e.styleRole, e.isAdoptive);
            const sameRow = Math.abs(a.cy - b.cy) < 1;
            if (sameRow) {
              return <line key={e.relationshipId} x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy} {...style} />;
            }
            const [top, bottom] = a.cy < b.cy ? [a, b] : [b, a];
            const midY = (top.cy + bottom.cy) / 2;
            return (
              <path
                key={e.relationshipId}
                d={`M ${top.cx} ${top.cy} V ${midY} H ${bottom.cx} V ${bottom.cy}`}
                fill="none"
                {...style}
              />
            );
          })}
        </svg>

        {layout.nodes.map((n) => {
          const person = peopleById.get(n.personId);
          if (!person) return null;
          const pos = positions.get(n.personId)!;
          return (
            <div
              key={n.personId}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.cx, top: pos.cy }}
            >
              <GenealogyPersonCard
                person={person}
                isReference={n.personId === referencePersonId}
                roleLabel={directRoleLabel(n.personId, referencePersonId, relationships, typesById)}
                widthPx={CARD_WIDTH}
                onTap={() => {
                  if (didDragRef.current) return;
                  onOpenPerson(n.personId);
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-[max(env(safe-area-inset-bottom),16px)] right-4 flex flex-col gap-2">
        <button
          onClick={() => fitBounds(0, worldWidth, 0, worldHeight)}
          className="focus-ring glass-strong flex h-10 w-10 items-center justify-center rounded-full text-ink-200"
          aria-label="Torna allo zoom iniziale"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() => referencePos && centerOn(referencePos.cx, referencePos.cy)}
          className="focus-ring glass-strong flex h-10 w-10 items-center justify-center rounded-full text-aura-cyan"
          aria-label="Centra sulla persona di riferimento"
        >
          <Locate size={16} />
        </button>
      </div>
    </div>
  );
}
