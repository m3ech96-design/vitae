"use client";
import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";

const PROJECTION_MIN_DAY = 3;

export function BudgetRing({
  spent,
  budget,
  projected,
  onSetBudget,
}: {
  spent: number;
  budget: number | null;
  /** Proiezione a fine mese al ritmo attuale (lib/finance.ts). Non mostrata nei primissimi
   * giorni del mese, quando pochi dati la renderebbero poco affidabile. */
  projected?: number | null;
  onSetBudget: (v: number) => void;
}) {
  const size = 176;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = budget ? spent / budget : 0;
  const dash = circumference * Math.min(pct, 1);

  const showProjection = Boolean(budget && projected && projected > spent && new Date().getDate() >= PROJECTION_MIN_DAY);
  const projectedPct = showProjection && budget ? (projected as number) / budget : 0;
  // La tinta reagisce anche alla proiezione, non solo alla spesa di oggi: può virare
  // all'ambra prima ancora di sforare per davvero, da vero avviso predittivo.
  const warnPct = showProjection ? Math.max(pct, projectedPct) : pct;
  const color = !budget ? "#565B77" : warnPct < 0.7 ? "#00E5C7" : warnPct < 1 ? "#FFB454" : "#FF4D6D";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget ? String(budget) : "");
  const spentAnimated = useCountUp(Math.round(spent));

  const confirm = () => {
    const n = parseFloat(draft.replace(",", "."));
    if (!Number.isNaN(n) && n > 0) onSetBudget(n);
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 10px ${color}99)`, transition: "stroke-dasharray 0.7s ease" }}
          />
          {showProjection && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F1F1FA"
              strokeWidth={stroke + 5}
              fill="none"
              strokeDasharray={`5 ${circumference - 5}`}
              strokeDashoffset={-Math.min(projectedPct, 1) * circumference}
              className="animate-pulseSoft"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirm()}
                className="focus-ring w-20 rounded-lg border border-aura-violet/40 bg-white/[0.05] px-2 py-1 text-center text-lg text-ink-100"
              />
              <button onClick={confirm} className="focus-ring text-aura-cyan" aria-label="Conferma">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <>
              <span className="font-display text-2xl text-ink-100">
                {spentAnimated.toLocaleString("it-IT", { maximumFractionDigits: 0 })}€
              </span>
              <button
                onClick={() => {
                  setDraft(budget ? String(budget) : "");
                  setEditing(true);
                }}
                className="focus-ring mt-0.5 flex items-center gap-1 text-xs text-ink-600 hover:text-ink-200"
              >
                {budget ? `Su ${budget.toLocaleString("it-IT")}€` : "Imposta Budget"} <Pencil size={10} />
              </button>
              {budget && (
                <span className="mt-1 text-[11px]" style={{ color }}>
                  {Math.round(pct * 100)}%
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {showProjection && !editing && (
        <p className="text-[11px] text-ink-600">
          Di Questo Passo, Fine Mese A{" "}
          <span style={{ color }}>{Math.round(projected as number).toLocaleString("it-IT")}€</span>
        </p>
      )}
    </div>
  );
}
