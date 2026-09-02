"use client";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { WidgetSize } from "@/lib/widgets/types";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

const SIZE_LABEL: Record<WidgetSize, string> = {
  square: "Quadrato",
  half: "Mezza larghezza",
  full: "Larghezza intera",
};

export function WidgetActionsSheet({
  title,
  size,
  allowedSizes,
  canMoveUp,
  canMoveDown,
  onResize,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClose,
}: {
  title: string;
  size: WidgetSize;
  allowedSizes: WidgetSize[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onResize: (size: WidgetSize) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <PersonalCardSheet title={title} onClose={onClose}>
      <div className="space-y-5">
        {allowedSizes.length > 1 && (
          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Dimensione</p>
            <div className="flex flex-wrap gap-2">
              {allowedSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => onResize(s)}
                  className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs transition ${
                    size === s ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  {SIZE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Posizione</p>
          <div className="flex gap-2">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-xl2 border border-white/10 py-2.5 text-xs text-ink-300 disabled:opacity-30"
            >
              <ArrowUp size={13} /> Sposta su
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-xl2 border border-white/10 py-2.5 text-xs text-ink-300 disabled:opacity-30"
            >
              <ArrowDown size={13} /> Sposta giù
            </button>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-aura-pink/30 bg-aura-pink/[0.06] py-2.5 text-sm text-aura-pink hover:bg-aura-pink/[0.12]"
        >
          <Trash2 size={14} /> Rimuovi dalla home
        </button>
      </div>
    </PersonalCardSheet>
  );
}
