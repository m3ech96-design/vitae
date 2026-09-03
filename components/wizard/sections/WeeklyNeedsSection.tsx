"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useNeeds } from "@/lib/needs-context";
import { useMood } from "@/lib/mood-context";
import { NEED_SUGGESTIONS } from "@/lib/needs-catalog";
import { MoodPicker } from "@/components/vitaecom/MoodPicker";

/**
 * "Quando ho voglia" — nessun bisogno è mai obbligatorio né decade con un fallimento da
 * segnalare: aggiungi solo quello che ti va, quando ti va. Dura una settimana, poi sparisce
 * in silenzio se non lo esaudisci — la Home lo ricorda nel frattempo (vedi WeeklyNeedsCard).
 *
 * Lo stato d'animo che genera esaudendolo non è più uno fisso uguale per tutti ("Appagato"):
 * si sceglie qui, individualmente per ogni bisogno, con la stessa sfera di selezione già
 * usata altrove (MoodPicker) — resta "Appagato" di default per chi non tocca la sfera, così
 * chi non se ne cura può continuare ad aggiungere un bisogno con un tocco solo, come prima.
 *
 * Sceglierne uno nuovo resta comunque anche un innesco suo, quello di chi comincia a
 * desiderare qualcosa (di serie "Curioso", configurabile come ogni altro innesco nel
 * pannello degli Stati D'Animo) — quello sì uguale per tutti, perché il desiderio in sé non
 * cambia da bisogno a bisogno quanto la soddisfazione di averlo esaudito.
 */
export function WeeklyNeedsSection() {
  const { needs, addNeed, cancelNeed } = useNeeds();
  const { fireTrigger, allMoods } = useMood();
  const [customLabel, setCustomLabel] = useState("");
  const [moodId, setMoodId] = useState("appagato");

  const activeLabels = new Set(needs.map((n) => n.label));
  const availableSuggestions = NEED_SUGGESTIONS.filter((s) => !activeLabels.has(s));
  const selectedMood = allMoods.find((m) => m.id === moodId);
  const moodOf = (id: string) => allMoods.find((m) => m.id === id);

  const pickNeed = (label: string) => {
    addNeed(label, moodId);
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
              <span className="flex items-center gap-2 text-sm text-ink-100">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: moodOf(n.moodId)?.color ?? "#8B90A8" }} />
                {n.label}
              </span>
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

      <div className="mb-2 flex items-center gap-2">
        <MoodPicker size={26} color={selectedMood?.color ?? "#8B90A8"} onPick={setMoodId} label="Che stato d'animo genera esaudendolo" />
        <span className="text-xs text-ink-600">
          Quando lo esaudisci, provi: <span style={{ color: selectedMood?.color }}>{selectedMood?.label ?? "Appagato"}</span>
        </span>
      </div>

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
