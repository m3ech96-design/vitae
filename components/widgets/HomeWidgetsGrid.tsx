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
 *
 * Corretto secondo ulteriori istruzioni: ogni widget piazzato ha il proprio `useLongPress`
 * (vedi WidgetShell — apre LE SUE azioni: ridimensiona/sposta/rimuovi) che ferma la
 * propagazione fin dal primo tocco (vedi lib/use-long-press.ts) apposta, per non aprire
 * ANCHE il foglio "aggiungi widget" della griglia insieme alle azioni del singolo widget.
 * Ma quando i widget piazzati riempiono per intero la griglia (in particolare basta un solo
 * widget "intera larghezza" per farlo, occupando da solo tutta una riga) non restava più
 * nessun punto di questo `<div>` genitore libero da un widget sopra: ogni pixel toccabile
 * apparteneva a un guscio che fermava la risalita, e il gesto lungo sulla griglia diventava
 * irraggiungibile — l'unico modo per aggiungerne un altro era rimuoverne prima uno.
 * Ora, in coda ai widget piazzati, c'è sempre un ultimo tassello dedicato — un quadrato
 * `+`, mai coperto da nessun widget perché non è mai l'ultimo elemento a essere sostituito
 * da uno di essi: solo aggiunto in più. Apribile sia con un tocco normale sia con la
 * pressione lunga, la stessa card vuota di quando i widget sono zero, solo più piccola per
 * non rubare troppo spazio quando la griglia è già piena di card vere.
 */
export function HomeWidgetsGrid({ onAddWidget }: { onAddWidget: () => void }) {
  const { hydrated, placed } = useWidgets();
  const gridLongPress = useLongPress(onAddWidget);
  const tileLongPress = useLongPress(onAddWidget);
  if (!hydrated) return null;

  if (placed.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddWidget}
        {...gridLongPress.handlers}
        className={`flex w-full flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/15 py-8 text-ink-600 transition hover:border-aura-violet/40 hover:text-ink-300 ${
          gridLongPress.pressing ? "scale-[0.98] opacity-80" : ""
        }`}
      >
        <Plus size={18} />
        <span className="text-xs">Aggiungi il tuo primo widget</span>
      </button>
    );
  }

  return (
    <div {...gridLongPress.handlers} className={`grid grid-cols-6 gap-3 ${gridLongPress.pressing ? "opacity-80" : ""}`}>
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
      <button
        type="button"
        onClick={onAddWidget}
        {...tileLongPress.handlers}
        aria-label="Aggiungi un altro widget"
        className={`col-span-2 flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl3 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/40 hover:text-ink-300 ${
          tileLongPress.pressing ? "scale-[0.97] opacity-80" : ""
        }`}
      >
        <Plus size={16} />
        <span className="text-[11px]">Aggiungi</span>
      </button>
    </div>
  );
}
