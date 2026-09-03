"use client";
import { useState } from "react";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHouseholdMessages, HouseholdMessage } from "@/lib/household-messages-context";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { GlassCard } from "../ui/GlassCard";

const URGENCY_COLOR: Record<HouseholdMessage["urgency"], string> = {
  normale: "#00E5C7",
  importante: "#FFB454",
  urgente: "#FF4D6D",
};

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "adesso";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h fa`;
  return `${Math.round(hours / 24)} g fa`;
}

export function HouseholdMessageCard({ message }: { message: HouseholdMessage }) {
  const { markRead, removeMessage } = useHouseholdMessages();
  const { people } = useHousehold();
  const { profile } = useProfile();
  const [expanded, setExpanded] = useState(false);
  const color = URGENCY_COLOR[message.urgency];

  // Chi deve confermare la lettura: l'utente stesso più gli altri umani della casa — mai gli
  // animali, che ovviamente non possono leggere un messaggio.
  const readers = [
    { id: "user", name: profile.firstName || "Tu" },
    ...people.filter((p) => !ANIMAL_KINDS.includes(p.kind)).map((p) => ({ id: p.id, name: p.firstName })),
  ];
  const readNames = readers.filter((r) => message.readBy.includes(r.id)).map((r) => r.name);
  const unreadReaders = readers.filter((r) => !message.readBy.includes(r.id));

  return (
    <GlassCard className="overflow-hidden p-0" style={{ borderColor: `${color}40` }}>
      <button onClick={() => setExpanded((v) => !v)} className="focus-ring flex w-full items-start gap-3 p-3.5 text-left">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <div className="min-w-0 flex-1">
          <p className={expanded ? "whitespace-pre-wrap text-sm text-ink-100" : "truncate text-sm text-ink-100"}>{message.text}</p>
          <p className="mt-0.5 text-[11px] text-ink-800">
            {timeAgo(message.createdAt)}
            {readNames.length > 0 ? ` · letto da ${readNames.join(", ")}` : ""}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeMessage(message.id);
          }}
          className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink"
          aria-label="Rimuovi"
        >
          <X size={14} />
        </button>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-3.5 py-3">
              {unreadReaders.length === 0 ? (
                <p className="text-[11px] text-ink-800">Letto da tutti.</p>
              ) : (
                unreadReaders.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => markRead(message.id, r.id)}
                    className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-ink-300 transition hover:border-aura-emerald/50 hover:text-ink-100"
                  >
                    <Check size={10} /> Segna come letto da {r.name}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
