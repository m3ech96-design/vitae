"use client";
import { useState } from "react";
import { Target, PiggyBank, Link2, Unlink, PartyPopper, RotateCcw } from "lucide-react";
import { WishlistItem, savingsPct, isFulfilled, unlockThreshold } from "@/lib/wishlist-types";
import { SavingsGoal } from "@/lib/types";
import { useCountUp } from "@/lib/use-count-up";
import { Button } from "../ui/Button";
import { LinkSavingsGoalSheet } from "./LinkSavingsGoalSheet";

/**
 * Il flusso versa/preleva NON è bilaterale (vedi il commento su `linkedTo` in
 * lib/wishlist-types.ts): versare o prelevare accade sempre in Finanze (salvadanaio
 * generale o un obiettivo), mai qui — questo componente si limita a MOSTRARE il riflesso di
 * quel movimento, mai a generarne uno proprio. Nessun pulsante +/- manuale: solo la scelta
 * di quale destinazione seguire, e "Esaudisci" per chiudere l'articolo.
 *
 * Più articoli possono condividere la stessa destinazione — ciascuno mostra semplicemente
 * lo stesso saldo, con l'unico tetto individuale del proprio prezzo (mai un riparto tra
 * loro): se il salvadanaio ha 600€ e A costa 200€, B 800€, entrambi collegati, A mostra
 * 200€ (saturo), B mostra 600€ (non saturo) — nessuna "riserva" divisa, lo stesso numero
 * fino al proprio tetto.
 *
 * "Esaudisci" compare SOLO quando l'articolo è già al 100% (`pct >= 1`, mai su
 * `displayedAmount > 0`): un articolo sotto il pieno non può essere esaudito. Questo è ciò
 * che rende sempre corretto prelevare `item.savedAmount` alla conferma (vedi
 * WishlistItemSheet) anche quando più articoli condividono la destinazione — un articolo
 * al 100% ha `savedAmount === unlockThreshold(item)` per costruzione, mai più della propria
 * soglia, quindi esaudirlo non tocca mai più di quanto gli spettasse davvero.
 *
 * La soglia da raggiungere per il 100% è il prezzo PIÙ un margine fisso di 1000€ (vedi
 * `unlockThreshold` in wishlist-types.ts) — non il prezzo da solo. L'etichetta sotto
 * l'anello mostra quindi questa soglia, non il prezzo nudo: altrimenti l'anello segnerebbe
 * 100% con l'articolo ancora irraggiungibile (mancano 1000€ veri).
 *
 * Tre stati, mai insieme:
 * - Non collegato a nulla: quota ferma a 0, invito a collegare una destinazione.
 * - Collegato (a `linkedGoal` risolto dal chiamante, o al salvadanaio generale se
 *   `linkedTo.kind === "general"`): l'anello segue dal vivo il saldo della destinazione.
 * - Esaudito (`item.fulfilledAmount`/`fulfilledAt` impostati): l'anello mostra l'importo
 *   fissato per sempre a quel momento, sganciato dalla destinazione — che nel frattempo può
 *   continuare a muoversi per altri motivi senza più riflettersi qui.
 */
export function SavingsRing({
  item,
  linkedGoal,
  allGoals,
  onLink,
  onUnlink,
  onFulfill,
  onUnfulfill,
}: {
  item: WishlistItem;
  /** L'obiettivo vero collegato, già risolto dal chiamante (undefined se `linkedTo` non è
   * di tipo "goal", o se l'obiettivo collegato è stato nel frattempo eliminato da Finanze). */
  linkedGoal: SavingsGoal | undefined;
  /** Gli obiettivi tra cui scegliere per un nuovo collegamento. */
  allGoals: SavingsGoal[];
  onLink: (linkedTo: NonNullable<WishlistItem["linkedTo"]>) => void;
  onUnlink: () => void;
  onFulfill: () => void;
  onUnfulfill: () => void;
}) {
  const size = 156;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const fulfilled = isFulfilled(item);
  const displayedAmount = fulfilled ? item.fulfilledAmount! : item.savedAmount;
  const pct = savingsPct(item);
  const threshold = unlockThreshold(item);
  const dash = circumference * pct;
  const color = fulfilled ? "#34D399" : pct >= 1 ? "#34D399" : pct >= 0.5 ? "#00E5C7" : "#7C5CFF";
  const savedAnimated = useCountUp(Math.round(displayedAmount));

  const [linking, setLinking] = useState(false);

  if (threshold === null) {
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
          <span className="text-xs text-ink-600">su {threshold.toLocaleString("it-IT")}€</span>
          <span className="mt-1 text-[11px]" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      {!fulfilled && (
        <p className="text-center text-[11px] text-ink-800">
          Prezzo {item.price!.toLocaleString("it-IT")}€ + margine di 1.000€ per poter esaudire
        </p>
      )}

      {fulfilled ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 text-xs text-aura-emerald">
            <PartyPopper size={12} /> Esaudito
          </p>
          <Button variant="outline" size="sm" onClick={onUnfulfill}>
            <RotateCcw size={13} /> Riapri
          </Button>
        </div>
      ) : item.linkedTo ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 text-xs text-ink-600">
            {item.linkedTo.kind === "general" ? (
              <>
                <PiggyBank size={12} className="text-aura-cyan" />
                Collegato al <span className="text-ink-200">salvadanaio generale</span>
              </>
            ) : (
              <>
                <Target size={12} className="text-aura-emerald" />
                Collegato all&apos;obiettivo <span className="text-ink-200">{linkedGoal?.label ?? "eliminato"}</span>
              </>
            )}
          </p>
          <p className="text-center text-[11px] text-ink-800">
            Sempre aggiornato da solo — versa o preleva dalla scheda Finanze, non da qui.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onUnlink}>
              <Unlink size={13} /> Scollega
            </Button>
            {pct >= 1 && (
              <Button size="sm" onClick={onFulfill}>
                <PartyPopper size={13} /> Esaudisci
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setLinking(true)}
          className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-ink-300 transition hover:border-aura-cyan/40"
        >
          <Link2 size={13} /> Collega a una destinazione di risparmio
        </button>
      )}

      {linking && (
        <LinkSavingsGoalSheet
          goals={allGoals}
          onSelect={(linkedTo) => {
            onLink(linkedTo);
            setLinking(false);
          }}
          onClose={() => setLinking(false)}
        />
      )}
    </div>
  );
}
