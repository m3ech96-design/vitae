"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { useTasks } from "@/lib/tasks-context";
import { useQuickInteraction } from "@/lib/quick-interaction-context";
import { isTaskActiveNow } from "@/lib/task-presence";
import { personMatchesQuery } from "@/lib/person-search";
import {
  applyInteraction,
  QUICK_INTERACTION_LABEL_POSITIVE,
  QUICK_INTERACTION_LABEL_NEGATIVE,
} from "@/lib/relationship";
import { capArray } from "@/lib/cap-array";
import { Person, ANIMAL_KINDS } from "@/lib/types";
import { PersonWindow } from "@/components/persone/PersonWindow";
import { QuickInteractionCard } from "./quick-interaction-card";
import { AnchoredDeltaLayer, AnchoredPulse } from "@/components/rapporti/AnchoredDeltaLayer";
import { WidgetSize } from "@/lib/widgets/types";

/** Le persone taggate in una task in corso ora entrano da sole tra "con te ora" — stessa
 * finestra oraria già usata per lo stato Casa/Fuori Casa (vedi task-presence.ts), non una
 * versione a parte da tenere allineata a mano. Il context si occupa già di non duplicare chi
 * è già presente (vedi recall). */
function useAutoRecallFromTasks() {
  const { tasks } = useTasks();
  const { recall } = useQuickInteraction();

  useEffect(() => {
    const check = () => {
      const now = new Date();
      tasks.forEach((t) => {
        if (isTaskActiveNow(t, now)) {
          t.linkedPersonIds.forEach((id) => recall(id));
        }
      });
    };
    check();
    // Ricontrolla ogni minuto: una task può entrare (o uscire) dalla finestra oraria mentre
    // il widget resta aperto sott'occhio in Home.
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);
}

export function QuickInteractionWidget({ size }: { size: WidgetSize }) {
  const { hydrated: householdHydrated, people, updatePerson } = useHousehold();
  const { profile } = useProfile();
  const { hydrated, presentIds, recentIds, recall, dismiss } = useQuickInteraction();
  const [query, setQuery] = useState("");
  const [openDiscoveriesFor, setOpenDiscoveriesFor] = useState<string | null>(null);
  const [pulses, setPulses] = useState<AnchoredPulse[]>([]);

  useAutoRecallFromTasks();

  const humans = useMemo(() => people.filter((p) => !ANIMAL_KINDS.includes(p.kind)), [people]);
  const byId = useMemo(() => new Map(humans.map((p) => [p.id, p])), [humans]);

  const present = presentIds.map((id) => byId.get(id)).filter((p): p is Person => Boolean(p));
  const recent = recentIds
    .map((id) => byId.get(id))
    .filter((p): p is Person => p !== undefined && !presentIds.includes(p.id));

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return humans.filter((p) => !presentIds.includes(p.id) && personMatchesQuery(p, query)).slice(0, 8);
  }, [humans, presentIds, query]);

  const fireAnchored = (anchor: HTMLElement, value: number) => {
    const rect = anchor.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setPulses((p) => [...p, { id, value, x: rect.left + rect.width / 2, y: rect.top }]);
    setTimeout(() => setPulses((p) => p.filter((x) => x.id !== id)), 1200);
  };

  const react = (person: Person, positive: boolean, anchor: HTMLElement) => {
    const isPartner = profile.partnerPersonId === person.id;
    const label = positive ? QUICK_INTERACTION_LABEL_POSITIVE : QUICK_INTERACTION_LABEL_NEGATIVE;
    const { patch, event } = applyInteraction(person, label, positive, isPartner);
    updatePerson(person.id, { ...patch, relationshipHistory: capArray([...person.relationshipHistory, event], 300) });
    fireAnchored(anchor, event.delta);
  };

  if (!hydrated || !householdHydrated) return null;

  const openDiscoveriesPerson = openDiscoveriesFor ? byId.get(openDiscoveriesFor) ?? null : null;

  return (
    // stopPropagation al primo pointerdown, sull'intero widget: il guscio (WidgetShell) ha
    // una propria pressione lunga sul contenitore per ridimensionare/spostare/rimuovere (vedi
    // useLongPress) — qui dentro i gesti devono restare tap secchi e ripetuti, e anche scrivere
    // nella ricerca non deve rischiare di far scattare quel menu se il dito resta fermo un
    // filo più a lungo del previsto. Un solo handler qui in cima basta per tutti i figli,
    // stesso principio già usato da ShortcutsWidget.tsx sui propri pulsanti interni.
    <div onPointerDown={(e) => e.stopPropagation()}>
      <p className="mb-3 flex items-center gap-1.5 font-display text-xs text-ink-100">
        <Users size={13} className="text-ink-600" /> Interazione rapida
      </p>

      <div className="relative mb-3 shrink-0">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Richiama una persona..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2 pl-8 pr-8 text-xs text-ink-100 placeholder:text-ink-800"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-800 hover:text-ink-200"
            aria-label="Cancella ricerca"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {query.trim() ? (
        <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain" style={{ touchAction: "pan-y" }}>
          {searchResults.length === 0 && <p className="py-4 text-center text-xs text-ink-800">Nessun risultato.</p>}
          {searchResults.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                recall(p.id);
                setQuery("");
              }}
              className="focus-ring flex w-full items-center gap-2.5 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition hover:border-aura-cyan/40"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                {p.firstName} {p.lastName}
              </span>
              <span className="shrink-0 text-[11px] text-aura-cyan">Richiama</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {recent.length > 0 && (
            <div className="mb-3 shrink-0">
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-800">Appena salutate</p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => recall(p.id)}
                    className="focus-ring shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-ink-300 transition hover:border-aura-cyan/40"
                  >
                    {p.firstName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* max-h esplicito, non flex-1/h-full: il guscio del widget (`full`, vedi
             WidgetShell.tsx) dà altezza al proprio contenuto in base a QUESTO contenuto, non
             il contrario — un genitore senza altezza propria dichiarata collassa a 0 con
             `h-full`/`flex-1` (esattamente il motivo per cui gli altri widget "full" del
             catalogo crescono con la propria altezza intrinseca, mai con flex-1). Con poche
             persone il widget resta basso, oltre una certa altezza scrolla qui dentro invece
             di continuare a crescere all'infinito nella Home. */}
          <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain" style={{ touchAction: "pan-y" }}>
            {present.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={18} className="text-ink-800" />
                <p className="text-xs text-ink-600">Nessuno con te ora — cercalo qui sopra.</p>
              </div>
            ) : (
              present.map((p) => (
                <QuickInteractionCard
                  key={p.id}
                  person={p}
                  onPositive={(anchor) => react(p, true, anchor)}
                  onNegative={(anchor) => react(p, false, anchor)}
                  onOpenDiscoveries={() => setOpenDiscoveriesFor(p.id)}
                  onDismiss={() => dismiss(p.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      <AnchoredDeltaLayer pulses={pulses} />
      {openDiscoveriesPerson && <PersonWindow person={openDiscoveriesPerson} onClose={() => setOpenDiscoveriesFor(null)} />}
    </div>
  );
}
