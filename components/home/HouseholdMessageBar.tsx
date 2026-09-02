"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { useHouseholdMessages, MessageUrgency } from "@/lib/household-messages-context";
import { GlassCard } from "../ui/GlassCard";

const URGENCY_META: { id: MessageUrgency; label: string; color: string }[] = [
  { id: "normale", label: "Normale", color: "#00E5C7" },
  { id: "importante", label: "Importante", color: "#FFB454" },
  { id: "urgente", label: "Urgente", color: "#FF4D6D" },
];

/**
 * "Delle dimensioni delle notifiche" — stessa altezza/stile compatto di una card di
 * notifica, non un editor grande: scrivere ai membri della casa deve restare un gesto
 * rapido, non un modulo.
 */
export function HouseholdMessageBar() {
  const { addMessage } = useHouseholdMessages();
  const [text, setText] = useState("");
  const [urgency, setUrgency] = useState<MessageUrgency>("normale");
  const meta = URGENCY_META.find((u) => u.id === urgency)!;

  const send = () => {
    if (!text.trim()) return;
    addMessage(text.trim(), urgency);
    setText("");
    setUrgency("normale");
  };

  return (
    <GlassCard className="flex items-center gap-2 p-2.5">
      <button
        onClick={() => setUrgency(URGENCY_META[(URGENCY_META.findIndex((u) => u.id === urgency) + 1) % URGENCY_META.length].id)}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition"
        style={{ borderColor: `${meta.color}55`, background: `${meta.color}18` }}
        title={`Urgenza: ${meta.label} — tocca per cambiare`}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Scrivi ai membri della casa..."
        className="focus-ring min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800"
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950 disabled:opacity-30"
        aria-label="Invia"
      >
        <Send size={14} />
      </button>
    </GlassCard>
  );
}
