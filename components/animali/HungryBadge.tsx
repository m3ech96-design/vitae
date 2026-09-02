"use client";
import { useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Person } from "@/lib/types";
import { isHungry } from "@/lib/feeding";
import { useHousehold } from "@/lib/household-context";
import { newId } from "@/lib/id";
import { applyInteraction } from "@/lib/relationship";
import { capArray } from "@/lib/cap-array";
import { useAnimalFood } from "@/lib/animal-food-context";
import { useMood } from "@/lib/mood-context";

/**
 * Badge piccolo (come lo Zzz), MAI una nuvoletta: evita il problema di ritaglio
 * dentro le card con overflow-hidden. Interattivo solo dove c'è spazio sicuro
 * per aprire il menu del cibo (scheda Animali); in Home è solo un indicatore.
 *
 * Corretto secondo le istruzioni: non più un elenco generico di tipi di cibo (FOOD_TYPES),
 * ma i prodotti veri assegnati a QUESTO animale (per id, per gruppo, o per specie — vedi
 * lib/animal-food-context.tsx), esclusi quelli già esauriti. Ogni tocco consuma esattamente
 * una porzione dal prodotto scelto e registra il pasto — prodotto e orario esatto — nella
 * cronologia dell'animale (FeedingLogEntry.foodType porta ora il nome del prodotto, non più
 * un tipo generico; FeedingScheduleEditor.tsx mostra l'orario esatto, non solo il giorno).
 */
export function HungryBadge({ person, interactive = false }: { person: Person; interactive?: boolean }) {
  const { updatePerson } = useHousehold();
  const { productsForAnimal, consumePortion } = useAnimalFood();
  const { fireTrigger } = useMood();
  const [hungry, setHungry] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setHungry(isHungry(person));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [person]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

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
    <div ref={boxRef} className="absolute -top-1 -right-1 z-20">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) setOpen((v) => !v);
        }}
        className="flex items-center gap-1 rounded-full border border-aura-amber/50 bg-void-950 px-1.5 py-0.5 text-[9px] text-aura-amber shadow-glow-sm animate-pulseSoft"
      >
        <UtensilsCrossed size={9} /> Fame
      </button>

      {interactive && open && (
        <div className="glass-strong absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl2 border border-white/10 p-1.5">
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
        </div>
      )}
    </div>
  );
}
