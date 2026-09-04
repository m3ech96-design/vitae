"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Flag, Volume2, User, Users, ChevronRight } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { normalizeNickname } from "@/lib/nickname-check";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { NicknameField } from "@/components/vitaecom/NicknameField";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { Button } from "@/components/ui/Button";

/**
 * "Impostazioni" — la scheda che sostituisce, nella barra online, il posto occupato prima
 * da un secondo accesso a "Persone" (ormai confluita in Mondo, vedi app/mondo/page.tsx):
 * qui vive tutto ciò che riguarda il TUO account Vitaecom, non un elenco di altri account.
 * Nickname (con lo stesso controllo di unicità del primo accesso, vedi NicknameGate),
 * account silenziati (con la possibilità di riattivarli), e un accesso rapido alle
 * Segnalazioni — che restano una scheda a parte apposta (vedi la nota in
 * app/segnalazioni/page.tsx sul perché non è tra le voci della barra).
 */
function Impostazioni() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { mutedAccountIds, unmuteAccount, reports } = useVitaecomSocial();
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname ?? "");
  const [nicknameValid, setNicknameValid] = useState(false);

  const saveNickname = () => {
    const normalized = normalizeNickname(nicknameDraft);
    if (!normalized || !nicknameValid) return;
    updateProfile({ nickname: normalized });
  };

  const hasNicknameChange = normalizeNickname(nicknameDraft) !== (profile.nickname ?? "") && normalizeNickname(nicknameDraft).length > 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-[#B79A6B]" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Impostazioni</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Il tuo account Vitaecom</h1>

      <div className="mt-7 space-y-9">
        <div>
          <p className="mb-3 font-display text-sm text-ink-100">Nickname</p>
          <NicknameField value={nicknameDraft} currentOwnNickname={profile.nickname} onChange={setNicknameDraft} onValidityChange={setNicknameValid} />
          {hasNicknameChange && (
            <Button size="sm" className="mt-3" onClick={saveNickname} disabled={!nicknameValid}>
              Salva nickname
            </Button>
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <button
            onClick={() => router.push("/vitaecom/profilo")}
            className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-white/20"
          >
            <span className="flex items-center gap-2.5 text-sm text-ink-100">
              <User size={15} className="text-ink-600" /> La tua vetrina e bacheca
            </span>
            <ChevronRight size={15} className="text-ink-600" />
          </button>
        </div>

        {/* "Chi conosci" non ha più una scheda propria dentro Vitaecom (confluita in Mondo,
           vedi app/mondo/page.tsx e il suo filtro "Vitaecom") — senza questo collegamento,
           uscire da Vitaecom verso Mondo richiederebbe prima tornare a "Home" e poi passare
           alla barra offline: un giro più lungo di quello che "Persone" offriva prima. */}
        <div className="border-t border-white/[0.06] pt-6">
          <button
            onClick={() => router.push("/mondo")}
            className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-white/20"
          >
            <span className="flex items-center gap-2.5 text-sm text-ink-100">
              <Users size={15} className="text-ink-600" /> Chi conosci su Vitaecom
            </span>
            <ChevronRight size={15} className="text-ink-600" />
          </button>
          <p className="mt-2 text-[11px] text-ink-800">
            Apre Mondo con il filtro &quot;Vitaecom&quot; — scoperte e rapporto vivono lì, come per chiunque altro conosci.
          </p>
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <button
            onClick={() => router.push("/segnalazioni")}
            className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-white/20"
          >
            <span className="flex items-center gap-2.5 text-sm text-ink-100">
              <Flag size={15} className="text-ink-600" /> Segnalazioni
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-600">
              {reports.length > 0 && <span className="h-2 w-2 rounded-full bg-aura-pink" />}
              <ChevronRight size={15} />
            </span>
          </button>
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <p className="mb-1 font-display text-sm text-ink-100">Account silenziati</p>
          <p className="mb-4 text-xs text-ink-800">Non vedrai più i loro post in Vitaeworld, finché non li riattivi da qui.</p>
          {mutedAccountIds.length === 0 ? (
            <p className="text-sm text-ink-800">Non hai silenziato nessun account.</p>
          ) : (
            <div className="space-y-2">
              {mutedAccountIds.map((id) => {
                const account = resolveAccount(id, userAccount);
                return (
                  <div key={id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
                    <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={40} ring="idle" glowColor="#B79A6B" />
                    <p className="min-w-0 flex-1 truncate text-sm text-ink-100">@{account.nickname}</p>
                    <button
                      onClick={() => unmuteAccount(id)}
                      className="focus-ring flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-400 transition hover:border-[#B79A6B]/50 hover:text-[#B79A6B]"
                    >
                      <Volume2 size={12} /> Riattiva
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImpostazioniVitaecomPage() {
  return (
    <NicknameGate>
      <Impostazioni />
    </NicknameGate>
  );
}
