"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useNeeds } from "@/lib/needs-context";
import { useMood } from "@/lib/mood-context";
import { NEED_SUGGESTIONS } from "@/lib/needs-catalog";

/**
 * "Quando ho voglia" — nessun bisogno è mai obbligatorio né decade con un fallimento da
 * segnalare: aggiungi solo quello che ti va, quando ti va. Dura una settimana, poi sparisce
 * in silenzio se non lo esaudisci — la Home lo ricorda nel frattempo (vedi WeeklyNeedsCard).
 *
 * Non genera solo lo stato d'animo di arrivo ("Appagato", quando lo esaudisci — vedi
 * WeeklyNeedsCard): sceglierne uno nuovo è già un innesco suo, quello di chi comincia a
 * desiderare qualcosa (di serie "Curioso", configurabile come ogni altro innesco nel
 * pannello degli Stati D'Animo).
 */
export function WeeklyNeedsSection() {
  const { needs, addNeed, cancelNeed } = useNeeds();
  const { fireTrigger } = useMood();
  const [customLabel, setCustomLabel] = useState("");

  const activeLabels = new Set(needs.map((n) => n.label));
  const availableSuggestions = NEED_SUGGESTIONS.filter((s) => !activeLabels.has(s));

  const pickNeed = (label: string) => {
    addNeed(label);
    fireTrigger("bisogni:desiderato");
  };

  const submitCustom = () => {
    if (!customLabel.trim()) return;
    pickNeed(customLabel.trim());
    setCustomLabel("");
  };

  return (
    <div>
      {needs.length > 0 && (
        <div className="mb-4 space-y-2">
          {needs.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between rounded-xl2 border border-aura-cyan/25 bg-aura-cyan/[0.05] px-3.5 py-2.5"
            >
              <span className="text-sm text-ink-100">{n.label}</span>
              <button
                onClick={() => cancelNeed(n.id)}
                className="focus-ring text-ink-800 hover:text-ink-400"
                aria-label="Rimuovi"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {availableSuggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => pickNeed(s)}
              className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-400 transition hover:border-aura-cyan/50 hover:text-ink-100"
            >
              <Plus size={11} /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCustom()}
          placeholder="O scrivi il tuo…"
          className="focus-ring flex-1 rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
        />
        <button
          onClick={submitCustom}
          disabled={!customLabel.trim()}
          className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 border border-white/10 text-ink-400 transition hover:border-aura-cyan/50 hover:text-ink-100 disabled:opacity-40"
          aria-label="Aggiungi"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
