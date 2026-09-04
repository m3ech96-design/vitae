"use client";
import { Plus } from "lucide-react";
import { useWidgets } from "@/lib/widgets/widgets-context";
import { WIDGET_MAP } from "@/lib/widgets/registry";
import { useLongPress } from "@/lib/use-long-press";
import { WidgetShell } from "./WidgetShell";

/**
 * Corretto secondo le istruzioni: "premi a lungo per aggiungere un widget" prima viveva sul
 * `<div>` radice dell'INTERA pagina Home (vedi app/home/page.tsx) — qualunque cosa nella
 * pagina che non avesse già un proprio `useLongPress` per fermare la risalita (la mappa per
 * collegare casa, le card della Home, gli avatar della famiglia...) lasciava comunque partire
 * quel timer da 550ms al primo tocco, perché l'evento risale fino alla radice. Bastava tenere
 * il dito un attimo più a lungo del normale — mirando con precisione un punto sulla mappa, per
 * esempio — per far comparire il foglio widget sopra a quello che si stava davvero facendo.
 * Il gesto ha senso solo QUI, sull'area dei widget stessa: spostato a questo unico contenitore,
 * il resto della pagina non lo vede più passare.
 *
 * Corretto anche un secondo problema, nascosto dal primo: con zero widget piazzati questo
 * componente non disegnava nulla — un'area vuota su cui "premi a lungo" non aveva alcun
 * indizio visibile, scopribile solo per caso (o perché lo sapevi già). Ora, in quel caso,
 * compare un riquadro tratteggiato esplicito, apribile anche con un tocco normale: il gesto
 * lungo resta comunque valido per chi lo preferisce, ma non è più l'unica strada.
 */
export function HomeWidgetsGrid({ onAddWidget }: { onAddWidget: () => void }) {
  const { hydrated, placed } = useWidgets();
  const longPress = useLongPress(onAddWidget);
  if (!hydrated) return null;

  if (placed.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddWidget}
        {...longPress.handlers}
        className={`flex w-full flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/15 py-8 text-ink-600 transition hover:border-aura-violet/40 hover:text-ink-300 ${
          longPress.pressing ? "scale-[0.98] opacity-80" : ""
        }`}
      >
        <Plus size={18} />
        <span className="text-xs">Aggiungi il tuo primo widget</span>
      </button>
    );
  }

  return (
    <div {...longPress.handlers} className={`grid grid-cols-6 gap-3 ${longPress.pressing ? "opacity-80" : ""}`}>
      {placed.map((p, index) => {
        const def = WIDGET_MAP[p.widgetId];
        if (!def) return null;
        const Comp = def.Component;
        return (
          <WidgetShell
            key={p.id}
            placedId={p.id}
            title={def.title}
            size={p.size}
            allowedSizes={def.allowedSizes}
            index={index}
            total={placed.length}
            pages={[<Comp key="main" size={p.size} />]}
            href={def.href}
          />
        );
      })}
    </div>
  );
}
