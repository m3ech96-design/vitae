"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// In pixel, deve combaciare con "w-48" nella classe del pannello qui sotto.
const MENU_WIDTH = 192;

/**
 * Unico punto d'accesso ai tre wizard di scelta (Stati D'Animo, Bisogni, Malattia): un
 * pulsante in alto a sinistra, leggermente sovrapposto all'avatar della card personale.
 * Prima erano sparsi (una pagina intera, una sezione del Profilo, un bottone testuale in
 * Home) — ora vivono tutti qui, e solo qui.
 *
 * Bug corretto — il menù veniva tagliato dalla card personale: la card è una GlassCard
 * con `overflow-hidden`, e le serve davvero (senza, il bagliore dello stato d'animo e la
 * sfumatura "sheen" sporgerebbero oltre gli angoli arrotondati) — quindi non è il caso di
 * toglierlo, come non lo si è tolto la volta scorsa che lo stesso overflow tagliava
 * qualcos'altro (vedi Checkpoint 7, nuvolette/Azioni). Qui il rimedio è diverso perché il
 * problema è diverso: un menù a tendina non ha nessun bisogno di vivere dentro quella
 * scatola. Ora esce davvero dal DOM della card con un portal (`createPortal` su
 * `document.body`) e si posiziona da solo in `position: fixed` sulle coordinate reali del
 * pulsante, misurate al momento dell'apertura — non più clippato da un antenato che non
 * lo riguarda. Si richiude da solo se scrolli (il pulsante si sposterebbe sotto di lui,
 * come qualunque popover) e si riallinea da solo se ruoti lo schermo o ridimensioni la
 * finestra.
 */
export function PersonalCardMenu() {
  const [open, setOpen] = useState(false);
  const [activeWizard, setActiveWizard] = useState<WizardKey | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { illness } = useIllness();
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;

    const positionMenu = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8));
      setMenuPos({ top: rect.bottom + 8, left });
    };
    positionMenu();

    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", positionMenu);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", positionMenu);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const wizardTitle =
    activeWizard === "mood" ? "Stati D'Animo" : activeWizard === "needs" ? "Bisogni Di Questa Settimana" : "";

  return (
    <>
      <div ref={triggerRef} className="absolute -left-1.5 -top-1.5 z-20">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="Stati D'Animo, Bisogni, Malattia"
          aria-haspopup="menu"
          aria-expanded={open}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-void-900/90 text-ink-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6)] backdrop-blur transition hover:border-aura-violet/50 hover:text-ink-100"
        >
          <Wand2 size={14} />
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && menuPos && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
                className="glass-strong z-50 w-48 overflow-hidden rounded-xl2 p-1.5"
              >
                {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    role="menuitem"
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
          </AnimatePresence>,
          document.body
        )}

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
