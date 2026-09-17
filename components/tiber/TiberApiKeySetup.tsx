"use client";
import { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import { useTiber } from "@/lib/tiber/context";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";

export function TiberApiKeySetup() {
  const { setApiKey } = useTiber();
  const [value, setValue] = useState("");

  return (
    <GlassCard glow="violet" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound size={16} className="text-aura-violet" />
        <p className="font-display text-sm text-ink-100">Serve una chiave Gemini</p>
      </div>
      <p className="mb-4 text-xs text-ink-600">
        Tiber usa il piano gratuito di Google Gemini per rispondere. La chiave resta solo su questo dispositivo, non entra
        mai nei backup dell'app.
      </p>
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mb-4 flex items-center gap-1.5 text-xs text-aura-cyan hover:underline"
      >
        Ottieni una chiave gratuita su Google AI Studio <ExternalLink size={11} />
      </a>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Incolla qui la chiave..."
          className="focus-ring min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
        />
        <Button size="sm" disabled={!value.trim()} onClick={() => setApiKey(value.trim())}>
          Salva
        </Button>
      </div>
    </GlassCard>
  );
}
