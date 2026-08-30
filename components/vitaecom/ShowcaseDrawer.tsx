"use client";
import { useState } from "react";
import { Pencil, Sparkles, Check } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import {
  ShowcaseCandidate,
  ShowcaseSource,
  SHOWCASE_SOURCE_LABEL,
  showcaseCandidates,
  resolveShowcase,
  isThumbSource,
} from "@/lib/vitaecom-showcase";
import { hashToUnit } from "@/lib/hash";
import { TASK_COLORS } from "@/lib/task-colors";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

function chipColor(key: string): string {
  return TASK_COLORS[Math.floor(hashToUnit(key) * TASK_COLORS.length) % TASK_COLORS.length];
}

function ShowcaseChip({ item }: { item: ShowcaseCandidate }) {
  const color = chipColor(item.key);
  if (isThumbSource(item.source) && item.imageUrl) {
    return (
      <span
        className="flex items-center gap-2 overflow-hidden rounded-full border py-1 pl-1 pr-3.5"
        style={{ borderColor: `${color}55`, background: `${color}14` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        <span className="text-xs text-ink-100">{item.label}</span>
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs text-ink-100"
      style={{ borderColor: `${color}55`, background: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {item.label}
    </span>
  );
}

const EDITOR_ORDER: ShowcaseSource[] = [
  "favoriteMovies",
  "favoriteMusic",
  "favoriteBooks",
  "favoriteGames",
  "favoriteFoods",
  "placesOfInterest",
  "favoriteCategories",
  "values",
  "traits",
  "lifestyle",
];

const MAX_SHOWCASE_ITEMS = 8;

function ShowcaseEditor({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useProfile();
  const selected = profile.vitaecomShowcase;
  const candidatesBySource = new Map<ShowcaseSource, ShowcaseCandidate[]>();
  showcaseCandidates(profile).forEach((c) => {
    if (!candidatesBySource.has(c.source)) candidatesBySource.set(c.source, []);
    candidatesBySource.get(c.source)!.push(c);
  });

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      updateProfile({ vitaecomShowcase: selected.filter((k) => k !== key) });
    } else if (selected.length < MAX_SHOWCASE_ITEMS) {
      updateProfile({ vitaecomShowcase: [...selected, key] });
    }
  };

  const hasAnyCandidate = EDITOR_ORDER.some((s) => (candidatesBySource.get(s)?.length ?? 0) > 0);

  return (
    <PersonalCardSheet title="Vetrina del profilo" onClose={onClose}>
      <p className="text-xs text-ink-800">
        Scegli fino a {MAX_SHOWCASE_ITEMS} cose da mostrare a chi visita il tuo profilo — pescate da ciò che hai già
        scritto in &quot;Il Tuo Profilo&quot;, non un campo nuovo da compilare da capo. {selected.length}/{MAX_SHOWCASE_ITEMS}{" "}
        scelte.
      </p>
      {!hasAnyCandidate && (
        <p className="mt-5 text-sm text-ink-600">
          Non hai ancora compilato nulla da mostrare — aggiungi qualcosa in &quot;Il Tuo Profilo&quot; (film, musica,
          valori, luoghi...) e torna qui.
        </p>
      )}
      <div className="mt-5 space-y-6">
        {EDITOR_ORDER.map((source) => {
          const items = candidatesBySource.get(source) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={source}>
              <p className="mb-2.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                {SHOWCASE_SOURCE_LABEL[source]}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const active = selected.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      disabled={!active && selected.length >= MAX_SHOWCASE_ITEMS}
                      className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition disabled:opacity-30 ${
                        active ? "border-[#B79A6B]/60 bg-[#B79A6B]/15 text-ink-100" : "border-white/10 text-ink-600"
                      }`}
                    >
                      {active && <Check size={12} className="text-[#B79A6B]" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PersonalCardSheet>
  );
}

/**
 * Il riquadro che spezza la parte alta del profilo — largo quanto lo schermo, non inserito
 * nel solito contenitore centrato con margini: è un breakout deliberato (`w-screen` con
 * margini negativi calcolati sul viewport), il primo elemento di tutta l'app che rompe quel
 * pattern apposta, per segnalare "qui è una vetrina, non una card come le altre". Oggi
 * contiene la Vetrina — una selezione di cose vere già scritte nel tuo profilo (film,
 * valori, luoghi...), non un bio testuale generico da un'altra scheda di testo libero: è un
 * cassetto pensato per accogliere altri contenuti/funzioni in futuro, questo è il primo.
 */
export function ShowcaseDrawer({ isOwner }: { isOwner: boolean }) {
  const { profile } = useProfile();
  const [editorOpen, setEditorOpen] = useState(false);
  const items = resolveShowcase(profile, profile.vitaecomShowcase);

  // Solo il proprietario ha oggi una Vetrina da mostrare — un account ospite (dimostrativo)
  // non ha un proprio profilo ricco dietro, quindi qui non c'è nulla di vero da pescare;
  // niente riquadro vuoto finto al suo posto.
  if (!isOwner && items.length === 0) return null;

  return (
    <div className="relative w-screen mx-[calc(50%-50vw)] border-y border-white/[0.06] bg-white/[0.015] px-6 py-5">
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.2em] text-[#B79A6B]">
            <Sparkles size={12} /> Vetrina
          </p>
          {isOwner && (
            <button
              onClick={() => setEditorOpen(true)}
              className="focus-ring flex items-center gap-1 text-[11px] text-ink-600 hover:text-ink-200"
            >
              <Pencil size={11} /> Modifica
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <button
            onClick={() => setEditorOpen(true)}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-xs text-ink-600 hover:border-[#B79A6B]/50 hover:text-ink-200"
          >
            <Pencil size={13} /> Aggiungi qualcosa alla tua vetrina
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <ShowcaseChip key={item.key} item={item} />
            ))}
          </div>
        )}
      </div>

      {editorOpen && <ShowcaseEditor onClose={() => setEditorOpen(false)} />}
    </div>
  );
}
