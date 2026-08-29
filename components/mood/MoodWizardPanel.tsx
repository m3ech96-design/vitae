"use client";
import { useState } from "react";
import { Plus, X, PowerOff } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { TRIGGER_CATALOG, TriggerCategory, MoodDefinition } from "@/lib/mood-catalog";
import { Button } from "../ui/Button";

const CATEGORY_ORDER: TriggerCategory[] = [
  "Task",
  "Luoghi",
  "Rapporti",
  "Scoperte",
  "Salute",
  "Finanze",
  "Animali",
  "Famiglia",
  "Bisogni",
];

function MoodChip({ mood, active, onClick }: { mood: MoodDefinition; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all"
      style={
        active
          ? { borderColor: `${mood.color}99`, background: `${mood.color}22`, color: "#F1F1FA" }
          : { borderColor: "rgba(255,255,255,0.1)", color: "#8B90A8" }
      }
    >
      <span className="h-2 w-2 rounded-full" style={{ background: mood.color }} />
      {mood.label}
    </button>
  );
}

function TriggerRow({
  label,
  moods,
  selectedIds,
  onChange,
}: {
  label: string;
  moods: MoodDefinition[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = moods.filter((m) => selectedIds.includes(m.id));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="rounded-xl2 border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm text-ink-200">{label}</span>
        <div className="flex shrink-0 items-center gap-1">
          {selected.length === 0 ? (
            <span className="text-[10px] text-ink-800">Nessuno</span>
          ) : (
            <div className="flex -space-x-1.5">
              {selected.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  className="h-4 w-4 rounded-full border border-void-900"
                  style={{ background: m.color }}
                  title={m.label}
                />
              ))}
            </div>
          )}
        </div>
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-4">
          {moods.map((m) => (
            <MoodChip key={m.id} mood={m} active={selectedIds.includes(m.id)} onClick={() => toggle(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Il wizard di scelta per gli Stati D'Animo — prima una pagina intera (`/stati`), ora vive
 * solo qui dentro, dietro il menù della card personale (vedi PersonalCardMenu): imposti uno
 * stato a mano, o decidi quali interazioni dell'app possono suggerirtelo da sole. Nessun
 * elenco fisso: aggiungi, togli, o ignora del tutto le interazioni che non ti interessano.
 */
export function MoodWizardPanel() {
  const {
    hydrated,
    allMoods,
    triggerMap,
    setTriggerMoods,
    addCustomMood,
    removeCustomMood,
    activeMood,
    activeMoodIntensity,
    setMoodManually,
    clearMood,
    shareMoodOnVitaecom,
    setShareMoodOnVitaecom,
  } = useMood();
  const [newMoodLabel, setNewMoodLabel] = useState("");
  const [addingMood, setAddingMood] = useState(false);

  if (!hydrated) return null;

  const current = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;

  const submitNewMood = () => {
    const label = newMoodLabel.trim();
    if (!label) return;
    addCustomMood(label);
    setNewMoodLabel("");
    setAddingMood(false);
  };

  return (
    <div>
      <p className="text-sm text-ink-600">
        Decidi Tu Quali Interazioni Dell&apos;App Possono Suggerirti Uno Stato — Nessuna Regola
        Fissa: Aggiungi, Togli, O Ignora Del Tutto Le Interazioni Che Non Ti Interessano.
      </p>

      <label className="mt-5 flex items-center justify-between gap-3 rounded-xl2 border border-white/10 px-4 py-3.5">
        <span>
          <span className="block text-sm text-ink-200">Condividi Stato D&apos;Animo Su Vitaecom</span>
          <span className="mt-0.5 block text-[11px] text-ink-800">
            Spenta, Il Tuo Profilo Mostra Sempre &quot;Normale&quot;, Qualunque Cosa Tu Provi Davvero.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={shareMoodOnVitaecom}
          onClick={() => setShareMoodOnVitaecom(!shareMoodOnVitaecom)}
          className={`focus-ring h-5 w-9 shrink-0 rounded-full transition-colors ${
            shareMoodOnVitaecom ? "bg-aura-violet" : "bg-white/10"
          }`}
        >
          <span
            className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
              shareMoodOnVitaecom ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </label>

      {current && (
        <div
          className="mt-5 flex items-center justify-between rounded-xl2 border p-4"
          style={{ borderColor: `${current.color}55`, background: `${current.color}14` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-9 w-9 shrink-0 rounded-full"
              style={{ background: `radial-gradient(circle at 35% 30%, ${current.color}, ${current.color}cc)`, boxShadow: `0 0 16px ${current.color}99` }}
            />
            <div>
              <p className="text-sm text-ink-100">Ti Senti {current.label}</p>
              <p className="text-[11px] text-ink-800">Sfuma Da Solo Nelle Prossime 12 Ore — Al {Math.round(activeMoodIntensity * 100)}%</p>
            </div>
          </div>
          <button onClick={clearMood} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Spegni Ora">
            <PowerOff size={16} />
          </button>
        </div>
      )}

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">I Tuoi Stati</p>
          <button
            onClick={() => setAddingMood((v) => !v)}
            className="focus-ring flex items-center gap-1 text-xs text-aura-cyan"
          >
            <Plus size={13} /> Nuovo
          </button>
        </div>

        {addingMood && (
          <div className="mb-3 flex items-center gap-2">
            <input
              autoFocus
              value={newMoodLabel}
              onChange={(e) => setNewMoodLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNewMood()}
              placeholder="Es. Determinato"
              className="focus-ring flex-1 rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
            />
            <Button size="sm" onClick={submitNewMood} disabled={!newMoodLabel.trim()}>
              Crea
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {allMoods.map((m) => (
            <div key={m.id} className="group relative">
              <button
                onClick={() => (m.id === "normale" ? clearMood() : setMoodManually(m.id))}
                className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 py-1.5 pl-3 text-xs text-ink-200 transition hover:border-white/25"
                style={{ paddingRight: m.builtIn ? 12 : 26 }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                {m.label}
              </button>
              {!m.builtIn && (
                <button
                  onClick={() => removeCustomMood(m.id)}
                  className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-800 hover:text-aura-pink"
                  aria-label={`Elimina ${m.label}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-ink-800">Tocca Uno Stato Per Impostarlo Subito, A Mano.</p>
      </div>

      <div className="mt-8 space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const triggers = TRIGGER_CATALOG.filter((t) => t.category === cat);
          if (triggers.length === 0) return null;
          return (
            <div key={cat}>
              <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">{cat}</p>
              <div className="space-y-2">
                {triggers.map((t) => (
                  <TriggerRow
                    key={t.key}
                    label={t.label}
                    moods={allMoods}
                    selectedIds={triggerMap[t.key] ?? []}
                    onChange={(ids) => setTriggerMoods(t.key, ids)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
