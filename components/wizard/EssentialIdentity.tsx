"use client";
import { useProfile } from "@/lib/profile-context";
import { computeAge, capitalizeWords } from "@/lib/text";
import { AvatarUploader } from "./AvatarUploader";
import { NicknameField } from "../vitaecom/NicknameField";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

const GENDERS = ["Donna", "Uomo", "Non Binario", "Preferisco Non Specificare"];

/**
 * Primo avvio, volutamente minimo: solo ciò che serve per far funzionare l'app da subito.
 * Non è più l'ultimo passo — "Avanti" prosegue nel wizard delle Scoperte (vedi
 * OnboardingWizard.tsx), che resta comunque sempre consultabile e modificabile con calma
 * dopo, da "Il Tuo Profilo".
 */
export function EssentialIdentity({ onNext }: { onNext: () => void }) {
  const { profile, updateProfile } = useProfile();
  const age = computeAge(profile.birthday);
  const canContinue = profile.firstName.trim().length > 0;

  return (
    <div>
      <Reveal>
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-aura-gradient shadow-glow-sm" />
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Vitae</p>
        </div>
        <h1 className="font-display text-2xl text-ink-100">Iniziamo da te</h1>
        <p className="mt-1.5 text-sm text-ink-600">
          Il resto — valori, interessi, lavoro e molto altro — lo scoprirai con calma nei prossimi passi, o
          quando vuoi da &quot;il tuo profilo&quot;.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <AvatarUploader
          imageUrl={profile.avatarUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          onChange={(url) => updateProfile({ avatarUrl: url })}
        />
      </Reveal>

      <Reveal delay={0.18} className="mt-8 grid grid-cols-2 gap-4">
        <TextField
          label="Nome"
          placeholder="Es. Alessandra"
          value={profile.firstName}
          onChange={(e) => updateProfile({ firstName: capitalizeWords(e.target.value) })}
          autoFocus
        />
        <TextField
          label="Cognome"
          placeholder="Es. Ferrari"
          value={profile.lastName}
          onChange={(e) => updateProfile({ lastName: capitalizeWords(e.target.value) })}
        />
      </Reveal>

      <Reveal delay={0.26} className="mt-4">
        <NicknameField
          value={profile.nickname || ""}
          onChange={(v) => updateProfile({ nickname: v })}
        />
      </Reveal>

      <Reveal delay={0.3} className="mt-4 grid grid-cols-2 gap-4">
        <TextField
          label="Compleanno"
          type="date"
          value={profile.birthday || ""}
          onChange={(e) => updateProfile({ birthday: e.target.value })}
          hint={age !== null ? `Età calcolata: ${age} anni` : undefined}
        />
        <label className="block">
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            Sesso
          </span>
          <select
            value={profile.gender || ""}
            onChange={(e) => updateProfile({ gender: e.target.value })}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
          >
            <option value="" disabled className="bg-void-800">
              Seleziona
            </option>
            {GENDERS.map((g) => (
              <option key={g} value={g} className="bg-void-800">
                {g}
              </option>
            ))}
          </select>
        </label>
      </Reveal>

      <Reveal delay={0.34}>
        <Button className="mt-9 w-full justify-center" onClick={onNext} disabled={!canContinue}>
          Avanti
        </Button>
      </Reveal>
    </div>
  );
}
