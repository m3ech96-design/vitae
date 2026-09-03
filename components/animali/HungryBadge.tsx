"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UtensilsCrossed } from "lucide-react";
import { Person } from "@/lib/types";
import { isHungry } from "@/lib/feeding";
import { useHousehold } from "@/lib/household-context";
import { newId } from "@/lib/id";
import { applyInteraction } from "@/lib/relationship";
import { capArray } from "@/lib/cap-array";
import { useAnimalFood } from "@/lib/animal-food-context";
import { useMood } from "@/lib/mood-context";
import { flippedMenuTop } from "@/lib/dropdown-position";

const LIST_WIDTH = 176;
const LIST_HEIGHT_ESTIMATE = 160;

/**
 * Badge "Fame" — corretto secondo le istruzioni su due fronti:
 *
 * 1. L'area toccabile ora copre l'intero avatar (non solo il piccolo cartellino "Fame" in
 *    alto a destra): toccare l'avatar di un animale affamato apre la lista, senza che il
 *    tocco arrivi anche al genitore (es. la card che aprirebbe la scheda della persona) —
 *    lo stopPropagation qui basta da solo, l'area allargata non è che una comodità in più
 *    per il dito. Nessuna finestra intrappolata nella card: la lista esce dal DOM con un
 *    portal su document.body, mai un discendente della card stessa.
 * 2. La posizione della lista è calcolata rispetto alla finestra reale (misurando il badge
 *    con getBoundingClientRect e aprendo verso l'alto se sotto non c'entra — vedi
 *    lib/dropdown-position.ts, la stessa correzione già fatta per altri cinque menu
 *    dell'app), non più "subito sotto il badge" a prescindere: prima poteva uscire dallo
 *    schermo senza modo di vederla né di scegliere, esattamente il bug segnalato in Mondo.
 *
 * Il resto invariato: prodotti veri assegnati a quest'animale (vedi
 * lib/animal-food-context.tsx), consumo di una porzione, cronologia con orario esatto.
 */
export function HungryBadge({ person, interactive = false }: { person: Person; interactive?: boolean }) {
  const { updatePerson } = useHousehold();
  const { productsForAnimal, consumePortion } = useAnimalFood();
  const { fireTrigger } = useMood();
  const [hungry, setHungry] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const tick = () => setHungry(isHungry(person));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [person]);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.right - LIST_WIDTH, window.innerWidth - LIST_WIDTH - 8));
      setPos({ top: flippedMenuTop(rect, LIST_HEIGHT_ESTIMATE), left });
    };
    position();
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", position);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (!hungry) return null;

  const availableFoods = productsForAnimal(person);

  const feed = (productId: string, productName: string) => {
    consumePortion(productId);
    const entry = { id: newId(), date: new Date().toISOString(), foodType: productName, productId };
    const { patch } = applyInteraction(person, `Le hai dato da mangiare: ${productName}`, true, false, 1);
    updatePerson(person.id, { ...patch, feedingLog: capArray([...person.feedingLog, entry], 500) });
    fireTrigger("animali:sfamato");
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`${person.firstName} ha fame${interactive ? " — tocca per scegliere cosa dargli da mangiare" : ""}`}
        className="absolute inset-0 z-20"
      >
        <span className="absolute -top-1 -right-1 flex items-center gap-1 rounded-full border border-aura-amber/50 bg-void-950 px-1.5 py-0.5 text-[9px] text-aura-amber shadow-glow-sm animate-pulseSoft">
          <UtensilsCrossed size={9} /> Fame
        </span>
      </button>

      {mounted &&
        interactive &&
        open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: LIST_WIDTH }}
            className="glass-strong z-[70] max-h-56 overflow-y-auto rounded-xl2 border border-white/10 p-1.5"
          >
            {availableFoods.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] text-ink-800">Nessun cibo disponibile — aggiungilo nella scheda Cibo.</p>
            )}
            {availableFoods.map((f) => (
              <button
                key={f.id}
                onClick={(e) => {
                  e.stopPropagation();
                  feed(f.id, f.name);
                }}
                className="focus-ring block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[11px] text-ink-300 hover:bg-white/[0.06] hover:text-ink-100"
              >
                {f.name}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
