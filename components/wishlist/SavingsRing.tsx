"use client";
import { useState } from "react";
import { Plus, Minus, Target, Link2, Unlink } from "lucide-react";
import { WishlistItem, savingsPct } from "@/lib/wishlist-types";
import { SavingsGoal } from "@/lib/types";
import { useCountUp } from "@/lib/use-count-up";
import { Button } from "../ui/Button";
import { LinkSavingsGoalSheet } from "./LinkSavingsGoalSheet";

/**
 * Due modalità distinte, mai insieme — vedi il commento su `linkedSavingsGoalId` in
 * wishlist-types.ts:
 * - Non collegato (comportamento di sempre): l'anello mostra `item.savedAmount`, i controlli
 *   +/- restano quelli manuali di sempre.
 * - Collegato a un SavingsGoal delle Finanze (`linkedGoal`, risolto dal chiamante — questo
 *   componente non vede FinanceContext da solo, vedi WishlistItemSheet): l'anello mostra
 *   `linkedGoal.currentAmount`/`linkedGoal.targetAmount` DIRETTAMENTE, mai `item.savedAmount`
 *   o `item.price` — è sempre il dato vero dell'obiettivo, non una copia. I controlli +/-
 *   spariscono: versare o prelevare si fa da Finanze, dove l'obiettivo vive davvero, non da
 *   qui (evita due punti che modificano lo stesso numero con logiche diverse). Resta solo il
 *   pulsante per scollegare.
 */
export function SavingsRing({
  item,
  linkedGoal,
  allGoals,
  onAddFunds,
  onRemoveFunds,
  onLink,
  onUnlink,
}: {
  item: WishlistItem;
  /** L'obiettivo vero collegato, già risolto dal chiamante (undefined se `linkedSavingsGoalId`
   * non è impostato o l'obiettivo collegato è stato nel frattempo eliminato da Finanze). */
  linkedGoal: SavingsGoal | undefined;
  /** Gli obiettivi tra cui scegliere per un nuovo collegamento — passati dal chiamante, che
   * è l'unico dei due contesti a vederli entrambi. */
  allGoals: SavingsGoal[];
  onAddFunds: (amount: number) => void;
  onRemoveFunds: (amount: number) => void;
  onLink: (goalId: string) => void;
  onUnlink: () => void;
}) {
  const size = 156;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const displayedAmount = linkedGoal ? linkedGoal.currentAmount : item.savedAmount;
  const displayedTarget = linkedGoal ? linkedGoal.targetAmount : item.price ?? 0;
  const pct = linkedGoal
    ? displayedTarget > 0
      ? Math.min(1, displayedAmount / displayedTarget)
      : 0
    : savingsPct(item);
  const dash = circumference * pct;
  const color = pct >= 1 ? "#34D399" : pct >= 0.5 ? "#00E5C7" : "#7C5CFF";
  const savedAnimated = useCountUp(Math.round(displayedAmount));

  const [amount, setAmount] = useState("");
  const [linking, setLinking] = useState(false);

  const parsedAmount = () => Math.max(0, parseFloat(amount.replace(",", ".")) || 0);
  const add = () => {
    const n = parsedAmount();
    if (n > 0) onAddFunds(n);
    setAmount("");
  };
  const remove = () => {
    const n = parsedAmount();
    if (n > 0) onRemoveFunds(n);
    setAmount("");
  };

  if (!item.price || item.price <= 0) {
    return <p className="text-xs text-ink-800">Imposta un prezzo per attivare l&apos;obiettivo di risparmio.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
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
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-xl text-ink-100">
            {savedAnimated.toLocaleString("it-IT", { maximumFractionDigits: 0 })}€
          </span>
          <span className="text-xs text-ink-600">su {displayedTarget.toLocaleString("it-IT")}€</span>
          <span className="mt-1 text-[11px]" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {linkedGoal ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 text-xs text-ink-600">
            <Target size={12} className="text-aura-emerald" />
            Collegato all&apos;obiettivo <span className="text-ink-200">{linkedGoal.label}</span>
          </p>
          <p className="text-center text-[11px] text-ink-800">
            Sempre aggiornato da solo — versa o preleva dalla scheda Finanze, non da qui.
          </p>
          <Button variant="outline" size="sm" onClick={onUnlink}>
            <Unlink size={13} /> Scollega
          </Button>
        </div>
      ) : (
        <>
          <div className="flex w-full items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Importo €"
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-sm text-ink-100 placeholder:text-ink-800"
            />
            <Button variant="outline" size="sm" onClick={remove} aria-label="Togli fondi">
              <Minus size={14} />
            </Button>
            <Button size="sm" onClick={add} aria-label="Aggiungi fondi">
              <Plus size={14} />
            </Button>
          </div>
          {allGoals.length > 0 && (
            <button
              onClick={() => setLinking(true)}
              className="focus-ring flex items-center gap-1.5 text-[11px] text-ink-600 hover:text-ink-300"
            >
              <Link2 size={11} /> Collega a un obiettivo di risparmio
            </button>
          )}
        </>
      )}

      {linking && (
        <LinkSavingsGoalSheet
          goals={allGoals}
          onSelect={(goalId) => {
            onLink(goalId);
            setLinking(false);
          }}
          onClose={() => setLinking(false)}
        />
      )}
    </div>
  );
}
