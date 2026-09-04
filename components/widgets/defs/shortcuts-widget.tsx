"use client";
import { useState } from "react";
import Link from "next/link";
import { Settings2, Plus, X, LayoutGrid } from "lucide-react";
import { useShortcuts } from "@/lib/shortcuts-context";
import { SHORTCUT_CATALOG, shortcutByHref } from "@/lib/shortcuts-catalog";
import { WidgetSize } from "@/lib/widgets/types";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

/**
 * Il pannello "Gestisci scorciatoie" — l'intero catalogo (vedi lib/shortcuts-catalog.ts),
 * ciascuna voce con un pulsante Aggiungi/Rimuovi a seconda che sia già scelta o no. Aperto
 * dal widget, non un'altra scheda a sé: è la stessa idea già vista per "Aggiungi Widget",
 * un catalogo da cui scegliere quello che serve.
 */
function ManageShortcutsSheet({ onClose }: { onClose: () => void }) {
  const { hrefs, addShortcut, removeShortcut } = useShortcuts();
  return (
    <PersonalCardSheet title="Gestisci scorciatoie" onClose={onClose}>
      <div className="space-y-2">
        {SHORTCUT_CATALOG.map((s) => {
          const selected = hrefs.includes(s.href);
          const Icon = s.icon;
          return (
            <div
              key={s.href}
              className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <Icon size={16} className="shrink-0 text-aura-cyan" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{s.label}</p>
                <p className="truncate text-[11px] text-ink-800">{s.desc}</p>
              </div>
              <button
                onClick={() => (selected ? removeShortcut(s.href) : addShortcut(s.href))}
                className={`focus-ring flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] transition ${
                  selected
                    ? "border-aura-pink/40 text-aura-pink hover:bg-aura-pink/10"
                    : "border-aura-cyan/40 text-aura-cyan hover:bg-aura-cyan/10"
                }`}
              >
                {selected ? (
                  <>
                    <X size={11} /> Rimuovi
                  </>
                ) : (
                  <>
                    <Plus size={11} /> Aggiungi
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </PersonalCardSheet>
  );
}

/**
 * "Scorciatoie" — prima una sezione fissa (quattro voci sempre uguali) direttamente nella
 * Home, ora un widget come qualunque altro: spostabile, ridimensionabile, rimovibile dalla
 * home, e soprattutto configurabile — l'utente sceglie quali delle scorciatoie possibili
 * (vedi lib/shortcuts-catalog.ts) mostrare, non solo le quattro di prima (che restano il
 * punto di partenza per chi non ha ancora scelto nulla, vedi shortcuts-context.tsx).
 *
 * A differenza degli altri widget, questo non ha un `href` di catalogo (vedi
 * lib/widgets/registry.tsx): contiene più link diversi al suo interno, non uno solo verso
 * cui portare l'intera card — `WidgetShell` applica `onClick` all'intera card solo quando
 * `href` è presente, quindi qui i link interni restano liberi di funzionare ciascuno per
 * conto proprio.
 */
export function ShortcutsWidget({ size }: { size: WidgetSize }) {
  const { hydrated, hrefs } = useShortcuts();
  const [manageOpen, setManageOpen] = useState(false);
  const shortcuts = hrefs.map(shortcutByHref).filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (!hydrated) return null;

  const gridCols = size === "square" ? "grid-cols-1" : size === "half" ? "grid-cols-2" : "grid-cols-4";
  const visibleCount = size === "square" ? 2 : size === "half" ? 4 : shortcuts.length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-xs text-ink-100">
          <LayoutGrid size={13} className="text-ink-600" /> Scorciatoie
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setManageOpen(true);
          }}
          className="focus-ring text-ink-600 hover:text-ink-200"
          aria-label="Gestisci scorciatoie"
        >
          <Settings2 size={13} />
        </button>
      </div>

      {shortcuts.length === 0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setManageOpen(true);
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-cyan/40"
        >
          <Plus size={15} />
          <span className="text-[11px]">Scegli le tue scorciatoie</span>
        </button>
      ) : (
        <div className={`grid flex-1 gap-2 ${gridCols}`}>
          {shortcuts.slice(0, visibleCount).map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col justify-center rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/20"
              >
                <Icon size={15} className="text-aura-cyan" />
                <p className="mt-1.5 truncate font-display text-[11px] text-ink-100">{s.label}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* A dimensione ridotta non c'è spazio per mostrarle tutte (vedi `visibleCount`) —
         questo non le nasconde per sempre: restano scelte (vedi il pannello Gestisci) e
         tornano visibili ingrandendo il widget, qui solo segnalate perché l'utente sappia
         che ce ne sono altre, non che ne abbia scelte solo due o quattro. */}
      {shortcuts.length > visibleCount && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setManageOpen(true);
          }}
          className="mt-2 text-[10px] text-ink-800 hover:text-ink-400"
        >
          +{shortcuts.length - visibleCount} altre — ingrandisci o gestisci
        </button>
      )}

      {manageOpen && <ManageShortcutsSheet onClose={() => setManageOpen(false)} />}
    </div>
  );
}
