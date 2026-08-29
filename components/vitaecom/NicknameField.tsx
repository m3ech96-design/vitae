"use client";
import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { normalizeNickname, nicknameFormatError, isNicknameTaken } from "@/lib/nickname-check";
import { TextField } from "../ui/TextField";

type Status = "idle" | "checking" | "free" | "taken" | "invalid";

/**
 * "Va inserito con internet attivo, perché il sistema deve capire se esiste già" — senza un
 * vero backend il controllo è per forza locale (vedi lib/nickname-check.ts), ma l'attesa e
 * i due esiti (errore / successo) sono reali e non finti: la stessa interfaccia funzionerà
 * identica il giorno in cui quella funzione parlerà con un server vero.
 */
export function NicknameField({
  value,
  currentOwnNickname,
  onChange,
  onValidityChange,
  autoFocus,
}: {
  value: string;
  currentOwnNickname?: string;
  onChange: (v: string) => void;
  onValidityChange?: (valid: boolean) => void;
  autoFocus?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const n = normalizeNickname(value);
    if (!n) {
      setStatus("idle");
      onValidityChange?.(false);
      return;
    }
    const fmtErr = nicknameFormatError(n);
    if (fmtErr) {
      setStatus("invalid");
      onValidityChange?.(false);
      return;
    }
    setStatus("checking");
    const t = setTimeout(() => {
      const taken = isNicknameTaken(n, currentOwnNickname);
      setStatus(taken ? "taken" : "free");
      onValidityChange?.(!taken);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currentOwnNickname]);

  return (
    <div>
      <TextField
        label="Nickname"
        placeholder="Es. cyberpunk_maryjane96"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      <div className="mt-1.5 flex min-h-[16px] items-center gap-1.5 text-xs">
        {status === "checking" && (
          <>
            <Loader2 size={12} className="animate-spin text-ink-600" />
            <span className="text-ink-600">Verifica In Corso…</span>
          </>
        )}
        {status === "free" && (
          <>
            <Check size={12} className="text-aura-cyan" />
            <span className="text-aura-cyan">Nickname Libero</span>
          </>
        )}
        {status === "taken" && (
          <>
            <X size={12} className="text-aura-pink" />
            <span className="text-aura-pink">Nickname Già In Uso</span>
          </>
        )}
        {status === "invalid" && (
          <>
            <X size={12} className="text-aura-pink" />
            <span className="text-aura-pink">{nicknameFormatError(value)}</span>
          </>
        )}
      </div>
    </div>
  );
}
