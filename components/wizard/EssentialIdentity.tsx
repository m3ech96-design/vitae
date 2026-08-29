"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
 * Tutto il resto (Valori, Stile Di Vita, Istruzione, Corpo, Casa, Interessi...) si compila
 * con calma dopo, da "Il Tuo Profilo" — non è un modulo obbligatorio lungo una rampa di scale.
 * È la primissima cosa che chiunque vede dell'app: merita un ingresso, non solo un modulo.
 */
export function EssentialIdentity() {
  const { profile, updateProfile } = useProfile();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const age = computeAge(profile.birthday);
  const canStart = profile.firstName.trim().length > 0;

  const start = () => {
    if (!canStart || leaving) return;
    setLeaving(true);
    // Il respiro di luce ha bisogno del suo momento prima che la pagina cambi — non è un
    // ritardo artificiale, è la soglia tra il modulo e l'app che si accende.
    setTimeout(() => {
      updateProfile({ onboardingComplete: true });
      router.push("/home");
    }, 550);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center overflow-hidden px-6 pb-10 pt-[max(env(safe-area-inset-top),2rem)] sm:px-6">
      <AnimatePresence>
        {leaving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.25 }}
            animate={{ opacity: 1, scale: 2.6 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 z-50"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(124,92,255,0.55), rgba(0,229,199,0.25) 45%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 0.97 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Reveal>
          <div className="mb-8 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-aura-gradient shadow-glow-sm" />
            <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Vitae</p>
          </div>
          <h1 className="font-display text-2xl text-ink-100">Iniziamo Da Te</h1>
          <p className="mt-1.5 text-sm text-ink-600">
            Il Resto — Valori, Interessi, Lavoro E Molto Altro — Lo Scoprirai Con Calma, Quando Vuoi,
            Da &quot;Il Tuo Profilo&quot;.
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
            hint={age !== null ? `Età Calcolata: ${age} Anni` : undefined}
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
          <Button className="mt-9 w-full justify-center" onClick={start} disabled={!canStart || leaving}>
            Inizia <ArrowRight size={16} />
          </Button>
        </Reveal>
      </motion.div>
    </div>
  );
}
