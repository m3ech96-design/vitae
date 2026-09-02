"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { WishlistItem, savingsPct } from "@/lib/wishlist-types";
import { useCountUp } from "@/lib/use-count-up";
import { Button } from "../ui/Button";

export function SavingsRing({
  item,
  onAddFunds,
  onRemoveFunds,
}: {
  item: WishlistItem;
  onAddFunds: (amount: number) => void;
  onRemoveFunds: (amount: number) => void;
}) {
  const size = 156;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = savingsPct(item);
  const dash = circumference * pct;
  const color = pct >= 1 ? "#34D399" : pct >= 0.5 ? "#00E5C7" : "#7C5CFF";
  const savedAnimated = useCountUp(Math.round(item.savedAmount));

  const [amount, setAmount] = useState("");

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
          <span className="text-xs text-ink-600">su {item.price.toLocaleString("it-IT")}€</span>
          <span className="mt-1 text-[11px]" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

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
    </div>
  );
}
