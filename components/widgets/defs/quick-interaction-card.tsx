"use client";
import { useRef } from "react";
import { ThumbsUp, ThumbsDown, FileText, X } from "lucide-react";
import { Person } from "@/lib/types";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

/**
 * Una persona dentro il widget Interazione Rapida — avatar, nome, e i quattro gesti a un
 * tocco: positiva (verde), negativa (rosso), apri le Scoperte, e "ci siamo salutati" (X).
 * Nessun campo di testo qui: le interazioni partono con una frase segnaposto (vedi
 * lib/relationship.ts, QUICK_INTERACTION_LABEL_*) e si raccontano dopo, con calma, dentro
 * Rapporti — questo widget serve solo a registrarle sul momento, non a scriverle.
 *
 * `onPositive`/`onNegative` ricevono anche l'elemento toccato: il chiamante ne legge la
 * posizione a schermo per far partire da lì il "+N" fluttuante (vedi AnchoredDeltaLayer),
 * che deve restare fuori dal DOM di questa card per non rischiare di finire tagliato dallo
 * scroll interno del widget.
 */
export function QuickInteractionCard({
  person,
  onPositive,
  onNegative,
  onOpenDiscoveries,
  onDismiss,
}: {
  person: Person;
  onPositive: (anchor: HTMLElement) => void;
  onNegative: (anchor: HTMLElement) => void;
  onOpenDiscoveries: () => void;
  onDismiss: () => void;
}) {
  const positiveRef = useRef<HTMLButtonElement>(null);
  const negativeRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
      <AuraAvatar imageUrl={person.avatarUrl} firstName={person.firstName} lastName={person.lastName} size={44} ring="none" />
      <p className="min-w-0 flex-1 truncate font-display text-sm text-ink-100">
        {person.firstName} {person.lastName}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          ref={positiveRef}
          onClick={() => positiveRef.current && onPositive(positiveRef.current)}
          aria-label={`Interazione positiva con ${person.firstName}`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-400 transition hover:bg-emerald-400/25 active:scale-95"
        >
          <ThumbsUp size={15} />
        </button>
        <button
          ref={negativeRef}
          onClick={() => negativeRef.current && onNegative(negativeRef.current)}
          aria-label={`Interazione negativa con ${person.firstName}`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-400 transition hover:bg-rose-500/25 active:scale-95"
        >
          <ThumbsDown size={15} />
        </button>
        <button
          onClick={onOpenDiscoveries}
          aria-label={`Apri le scoperte di ${person.firstName}`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:border-aura-cyan/50 hover:text-aura-cyan"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={onDismiss}
          aria-label={`${person.firstName} non è più con te`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-600 transition hover:border-white/25 hover:text-ink-200"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
