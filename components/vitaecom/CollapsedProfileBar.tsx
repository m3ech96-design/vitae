"use client";
import { ArrowLeft } from "lucide-react";
import { AuraAvatar } from "../ui/AuraAvatar";

/**
 * Il riquadro fisso in alto (sotto il notch, dove prima stava solo "Indietro") che prende
 * il posto di vetrina/avatar/nickname mentre scorri verso il basso in un profilo altrui —
 * vedi `progress` calcolato nella pagina, `[0, 1]` in scroll diretto (nessun caso speciale
 * per "tornare indietro": scrollare in alto rifà semplicemente la stessa interpolazione al
 * contrario, la stessa che l'ha creata). Il riempimento liquido nel colore dello stato
 * d'animo cresce con lo scroll fino a tre quarti dell'altezza, con un guizzo in più a ogni
 * evento di scroll (`pulsing`) che si assesta da solo quando ti fermi.
 */
export function CollapsedProfileBar({
  progress,
  pulsing,
  onBack,
  avatarUrl,
  nickname,
  moodColor,
}: {
  progress: number;
  pulsing: boolean;
  onBack: () => void;
  avatarUrl?: string;
  nickname: string;
  moodColor: string;
}) {
  if (progress <= 0.02) return null;

  const barOpacity = Math.min(1, progress * 2.2);
  const fillHeightPct = Math.min(75, progress * 75);
  // L'avatar arriva verso la fine della corsa, non da subito — prima si rimpicciolisce
  // ancora nel flusso normale (vedi ProfileHeader), qui compare solo quando gli si avvicina.
  const avatarReveal = Math.min(1, Math.max(0, (progress - 0.45) / 0.5));
  const nicknameOpacity = Math.min(1, Math.max(0, (progress - 0.75) / 0.25));

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 overflow-hidden border-b border-white/[0.06]"
      style={{
        height: "calc(env(safe-area-inset-top) + 52px)",
        opacity: barOpacity,
        background: "rgba(15,18,32,0.68)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      <div
        className="lato-stato-line absolute inset-x-0 bottom-0 transition-[height,opacity] duration-150"
        style={{
          height: `${fillHeightPct}%`,
          opacity: pulsing ? 0.85 : 0.5,
          background: `linear-gradient(120deg, ${moodColor}, #fff5, ${moodColor})`,
          boxShadow: pulsing ? `0 0 20px 2px ${moodColor}aa` : `0 0 10px 0 ${moodColor}66`,
        }}
      />
      <div className="relative flex h-full items-center gap-2.5 px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <button onClick={onBack} className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-100" aria-label="Indietro">
          <ArrowLeft size={16} />
        </button>
        <span
          className="shrink-0"
          style={{ transform: `scale(${0.5 + avatarReveal * 0.5})`, transformOrigin: "left center", opacity: avatarReveal }}
        >
          <AuraAvatar imageUrl={avatarUrl} firstName={nickname} size={34} ring="idle" />
        </span>
        <span className="truncate text-sm text-ink-100" style={{ opacity: nicknameOpacity }}>
          {nickname}
        </span>
      </div>
    </div>
  );
}
