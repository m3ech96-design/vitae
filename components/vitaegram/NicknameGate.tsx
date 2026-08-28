"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { normalizeNickname } from "@/lib/nickname-check";
import { NicknameField } from "./NicknameField";
import { Button } from "../ui/Button";

/**
 * "Se l'utente lascia il campo Nickname vuoto quando esce dal wizard di creazione, questo
 * gli verrà richiesto obbligatoriamente al primo accesso a Vitaegram — non può accedere se
 * non inserisce il nickname o il nickname è già utilizzato." Un cancello, non una pagina:
 * avvolge le rotte di Vitaegram e non mostra nulla sotto finché non c'è un nickname valido.
 */
export function NicknameGate({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const [draft, setDraft] = useState("");
  const [valid, setValid] = useState(false);

  if (profile.nickname) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Vitaegram</p>
      <h1 className="mt-2 font-display text-2xl text-ink-100">Scegli Il Tuo Nickname</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Serve Per Esistere Qui Dentro — Univoco, Non Potrai Entrare Finché Non Ne Scegli Uno Libero.
      </p>
      <div className="mt-7">
        <NicknameField value={draft} onChange={setDraft} onValidityChange={setValid} autoFocus />
      </div>
      <Button
        className="mt-6 w-full justify-center"
        disabled={!valid}
        onClick={() => updateProfile({ nickname: normalizeNickname(draft) })}
      >
        Entra In Vitaegram <ArrowRight size={16} />
      </Button>
    </div>
  );
}
