"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

/**
 * Corretto secondo le istruzioni: questa barra scriveva ai membri della casa (vedi
 * lib/household-messages-context.tsx, HouseholdMessagesFeed più sopra in Home, ancora
 * intatti — quel canale di messaggi umani resta invariato) — ora è l'accesso rapido al
 * maggiordomo Tiber. Stesso ingombro "delle dimensioni delle notifiche" di prima: scrivere
 * a Tiber da qui deve restare un gesto rapido, non un modulo.
 *
 * Non tenta di rispondere qui stesso (niente chat inline in Home): il messaggio scritto
 * apre la pagina dedicata /tiber già con quel testo pronto nell'URL, dove la conversazione
 * vera comincia — un solo posto dove Tiber vive e ha memoria del contesto, non due canali
 * paralleli che rischierebbero di disallinearsi.
 */
export function HouseholdMessageBar() {
  const router = useRouter();
  const [text, setText] = useState("");

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push(`/tiber?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <GlassCard className="flex items-center gap-2 p-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-aura-violet/40 bg-aura-violet/15">
        <Sparkles size={14} className="text-aura-violet" />
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Chiedi qualcosa a Tiber..."
        className="focus-ring min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800"
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950 disabled:opacity-30"
        aria-label="Invia a Tiber"
      >
        <Send size={14} />
      </button>
    </GlassCard>
  );
}
