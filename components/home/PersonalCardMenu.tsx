"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, Smile, Heart, HeartPulse } from "lucide-react";
import { useIllness } from "@/lib/illness-context";
import { IllnessSheet } from "../illness/IllnessSheet";
import { MoodWizardPanel } from "../mood/MoodWizardPanel";
import { WeeklyNeedsSection } from "../wizard/sections/WeeklyNeedsSection";
import { PersonalCardSheet } from "./PersonalCardSheet";

type WizardKey = "mood" | "needs" | "illness";

const MENU_ITEMS: { key: WizardKey; label: string; icon: typeof Smile }[] = [
  { key: "mood", label: "Stati D'Animo", icon: Smile },
  { key: "needs", label: "Bisogni", icon: Heart },
  { key: "illness", label: "Malattia", icon: HeartPulse },
];

/**
 * Unico punto d'accesso ai tre wizard di scelta (Stati D'Animo, Bisogni, Malattia): un
 * pulsante in alto a sinistra, leggermente sovrapposto all'avatar della card personale.
 * Prima erano sparsi (una pagina intera, una sezione del Profilo, un bottone testuale in
 * Home) — ora vivono tutti qui, e solo qui.
 */
export function PersonalCardMenu() {
  const [open, setOpen] = useState(false);
  const [activeWizard, setActiveWizard] = useState<WizardKey | null>(null);
  const { illness } = useIllness();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const wizardTitle =
    activeWizard === "mood" ? "Stati D'Animo" : activeWizard === "needs" ? "Bisogni Di Questa Settimana" : "";

  return (
    <>
      <div ref={ref} className="absolute -left-1.5 -top-1.5 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="Stati D'Animo, Bisogni, Malattia"
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-void-900/90 text-ink-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6)] backdrop-blur transition hover:border-aura-violet/50 hover:text-ink-100"
        >
          <Wand2 size={14} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute left-0 top-10 z-30 w-48 overflow-hidden rounded-xl2 p-1.5"
            >
              {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWizard(key);
                    setOpen(false);
                  }}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 transition hover:bg-white/[0.06]"
                >
                  <Icon size={14} className="text-aura-cyan" />
                  {label}
                  {key === "illness" && illness && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-aura-amber" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeWizard === "illness" && <IllnessSheet onClose={() => setActiveWizard(null)} />}

      {activeWizard === "mood" && (
        <PersonalCardSheet title={wizardTitle} onClose={() => setActiveWizard(null)}>
          <MoodWizardPanel />
        </PersonalCardSheet>
      )}

      {activeWizard === "needs" && (
        <PersonalCardSheet title={wizardTitle} onClose={() => setActiveWizard(null)}>
          <WeeklyNeedsSection />
        </PersonalCardSheet>
      )}
    </>
  );
}
