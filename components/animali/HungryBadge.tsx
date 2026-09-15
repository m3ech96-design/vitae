"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UtensilsCrossed, Check } from "lucide-react";
import { Person } from "@/lib/types";
import { isHungry } from "@/lib/feeding";
import { useHousehold } from "@/lib/household-context";
import { newId } from "@/lib/id";
import { applyInteraction } from "@/lib/relationship";
import { capArray } from "@/lib/cap-array";
import { useAnimalFood } from "@/lib/animal-food-context";
import { useMood } from "@/lib/mood-context";
import { flippedMenuTop } from "@/lib/dropdown-position";

const LIST_WIDTH = 192;
const LIST_HEIGHT_ESTIMATE = 200;

/**
 * Badge "Fame" — corretto secondo le istruzioni su tre fronti:
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
 * 3. Corretto secondo le istruzioni: prima ogni tocco su un alimento nutriva subito e
 *    chiudeva la lista — impossibile dare, per esempio, sia crocchette che umido nello
 *    stesso pasto, perché il secondo tocco non arrivava mai (il menu era già sparito dopo il
 *    primo). Ora ogni voce si seleziona/deseleziona con un tocco (una spunta, il menu resta
 *    aperto) e un'unica azione "Dai da mangiare" in fondo conferma tutti gli alimenti scelti
 *    insieme: una porzione consumata per ciascuno, una voce di cronologia per ciascuno (il
 *    pasto reale del gatto è comunque "crocchette + umido", non un solo alimento), ma un
 *    solo aggiornamento di relazione/umore per l'intero pasto — non uno per alimento, che
 *    avrebbe gonfiato l'effetto rispetto a un pasto vero.
 */
export function HungryBadge({ person, interactive = false }: { person: Person; interactive?: boolean }) {
  const { updatePerson } = useHousehold();
  const { productsForAnimal, consumePortion } = useAnimalFood();
  const { fireTrigger } = useMood();
  const [hungry, setHungry] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
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

  const toggle = (productId: string) => {
    setSelected((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  const confirmMeal = () => {
    if (selected.length === 0) return;
    const chosen = availableFoods.filter((f) => selected.includes(f.id));
    chosen.forEach((f) => consumePortion(f.id));
    const now = new Date().toISOString();
    const entries = chosen.map((f) => ({ id: newId(), date: now, foodType: f.name, productId: f.id }));
    const mealLabel = chosen.map((f) => f.name).join(" + ");
    const { patch } = applyInteraction(person, `Le hai dato da mangiare: ${mealLabel}`, true, false, 1);
    updatePerson(person.id, { ...patch, feedingLog: capArray([...person.feedingLog, ...entries], 500) });
    fireTrigger("animali:sfamato");
    setSelected([]);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setSelected([]);
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
            className="glass-strong z-[70] flex max-h-64 flex-col overflow-hidden rounded-xl2 border border-white/10"
          >
            <div className="max-h-48 overflow-y-auto p-1.5">
              {availableFoods.length === 0 && (
                <p className="px-2.5 py-2 text-[11px] text-ink-800">Nessun cibo disponibile — aggiungilo nella scheda Cibo.</p>
              )}
              {availableFoods.map((f) => {
                const isSelected = selected.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(f.id);
                    }}
                    className={`focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition ${
                      isSelected ? "bg-aura-cyan/15 text-ink-100" : "text-ink-300 hover:bg-white/[0.06] hover:text-ink-100"
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {isSelected && <Check size={12} className="shrink-0 text-aura-cyan" />}
                  </button>
                );
              })}
            </div>
            {availableFoods.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmMeal();
                }}
                disabled={selected.length === 0}
                className="shrink-0 border-t border-white/10 px-3 py-2.5 text-center text-[11px] font-medium text-aura-cyan transition disabled:text-ink-800"
              >
                {selected.length === 0
                  ? "Scegli almeno un alimento"
                  : `Dai da mangiare (${selected.length})`}
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
