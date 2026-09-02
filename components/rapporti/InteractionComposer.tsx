"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";

/**
 * "Nuova interazione", riscritta secondo le istruzioni: eliminato l'elenco di interazioni
 * predefinite (sia positive sia negative) — non è più una scelta tra frasi pronte, ma un
 * campo libero in due categorie, positiva e negativa. Ogni interazione scritta vale sempre
 * +/-3% (eliminato il concetto che potesse valere 1, 2 o 3 a seconda della frase scelta — vedi
 * lib/relationship.ts).
 */
export function InteractionComposer({ onSubmit }: { onSubmit: (label: string, positive: boolean) => void }) {
  const [tab, setTab] = useState<"positive" | "negative">("positive");
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, tab === "positive");
    setText("");
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("positive")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            tab === "positive" ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ThumbsUp size={13} /> Positiva
        </button>
        <button
          onClick={() => setTab("negative")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            tab === "negative" ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ThumbsDown size={13} /> Negativa
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={tab === "positive" ? "Cos'è successo di bello?" : "Cos'è successo di brutto?"}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className={`focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30 ${
            tab === "positive" ? "bg-aura-cyan/20 text-aura-cyan" : "bg-aura-pink/20 text-aura-pink"
          }`}
          aria-label="Aggiungi interazione"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
