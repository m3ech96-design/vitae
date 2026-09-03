"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/lib/profile-context";
import { UserProfile } from "@/lib/types";
import { EssentialIdentity } from "./EssentialIdentity";
import { DiscoveryStep } from "./DiscoveryStep";
import { IdentityCoreFields } from "./sections/IdentityCoreFields";
import { EducationWorkSection } from "./sections/EducationWorkSection";
import { CorpoSection } from "./sections/CorpoSection";
import { InterestsSection } from "./sections/InterestsSection";

const STEP_COUNT = 5;

/**
 * Il "completa wizard" di un tempo ora è "Avanti": l'Identità essenziale (nome, cognome,
 * immagine, compleanno, nickname, sesso) non chiude più il wizard da sola, agganciato invece
 * al wizard delle Scoperte — le stesse quattro sezioni già mostrate tutte insieme in "Il tuo
 * profilo" (IdentityCoreFields, EducationWorkSection, CorpoSection, InterestsSection), qui
 * una alla volta. "Il tuo profilo" resta comunque la stessa pagina di sempre, invariata: chi
 * salta tutto qui può sempre tornarci con calma dopo — questo wizard non è l'unico posto in
 * cui questi campi esistono, solo il primo invito a guardarli.
 *
 * Le Scoperte qui scrivono `profile` direttamente (`updateProfile`), non una bozza da
 * confermare dopo: stessa scelta già fatta in "Il tuo profilo" per l'utente (a differenza
 * delle Scoperte di un'altra Persona in PersonWindow, che passano da una bozza per generare
 * le Novità solo al salvataggio — l'utente non genera Novità su se stesso).
 */
export function OnboardingWizard() {
  const { profile, updateProfile } = useProfile();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const onUpdate = (patch: Partial<UserProfile>) => updateProfile(patch);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    // Il respiro di luce ha bisogno del suo momento prima che la pagina cambi — non è un
    // ritardo artificiale, è la soglia tra il wizard e l'app che si accende, spostata qui
    // sull'ultimo passo vero (non più su "Avanti" del primissimo passo).
    setTimeout(() => {
      updateProfile({ onboardingComplete: true });
      router.push("/home");
    }, 550);
  };

  const goNext = () => setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

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

      <motion.div animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 0.97 : 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 0 && <EssentialIdentity onNext={goNext} />}

            {step === 1 && (
              <DiscoveryStep title="Identità" description="Carattere, valori, punti di forza — tutto facoltativo." onBack={goBack} onNext={goNext}>
                <IdentityCoreFields data={profile} onUpdate={onUpdate} />
              </DiscoveryStep>
            )}

            {step === 2 && (
              <DiscoveryStep title="Istruzione e lavoro" onBack={goBack} onNext={goNext}>
                <EducationWorkSection data={profile} onUpdate={onUpdate} linkedPersonId="user" />
              </DiscoveryStep>
            )}

            {step === 3 && (
              <DiscoveryStep title="Corpo" onBack={goBack} onNext={goNext}>
                <CorpoSection data={profile} onUpdate={onUpdate} trackWeightHistory />
              </DiscoveryStep>
            )}

            {step === 4 && (
              <DiscoveryStep title="Interessi" onBack={goBack} onNext={finish} nextLabel="Entra in Vitae">
                <InterestsSection data={profile} onUpdate={onUpdate} />
              </DiscoveryStep>
            )}
          </motion.div>
        </AnimatePresence>

        {step > 0 && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-aura-violet" : "w-1.5 bg-white/15"}`} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
