"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, MoreHorizontal, X, Check, ArrowLeftRight } from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useLongPress } from "@/lib/use-long-press";
import { ALL_NAV_ITEMS, useNavSlots, NavItemDef } from "@/lib/nav-slots";

const HOME_ITEM: NavItemDef = { href: "/home", label: "Home", icon: HomeIcon };
const HIDDEN_ON = ["/", "/wizard"];
// L'albero genealogico espanso (vedi app/albero-genealogico/persona/[personId]/page.tsx) è
// un riquadro `fixed inset-0` a tutto schermo con una propria testata di navigazione (Indietro,
// Famiglie, Impostazioni) e un proprio pulsante flottante "Aggiungi persona" in basso — non un
// contenuto scrollabile qualunque. Bug reale corretto: la barra qui sotto (anche lei `fixed`,
// con `z-40`) restava comunque montata sopra quel riquadro, e finiva per coprire fisicamente
// quel pulsante in basso a sinistra — visivamente sotto la barra, e per lo stesso motivo mai
// cliccabile, esattamente come già evitato per "/" e "/wizard" qui sopra.
const HIDDEN_PREFIX_ON = ["/albero-genealogico/persona/"];

/** L'alone viola dietro la scheda attiva — un solo elemento condiviso (stesso `layoutId` in
 * ogni pulsante che lo monta), non una ricolorazione istantanea: Framer Motion lo fa
 * scivolare da dove si trovava prima fino alla nuova posizione ogni volta che cambia scheda
 * attiva, nella stessa fila. */
function ActiveGlow() {
  return (
    <motion.span
      layoutId="offline-nav-glow"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-0 rounded-full bg-aura-violet/15 shadow-glow-sm"
    />
  );
}

function NavButton({ item, active, onLongPress }: { item: NavItemDef; active: boolean; onLongPress?: () => void }) {
  const { handlers, pressing } = useLongPress(onLongPress ?? (() => {}));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      {...(onLongPress ? handlers : {})}
      onContextMenu={(e) => onLongPress && e.preventDefault()}
      className={clsx(
        "focus-ring relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
        pressing && "scale-90",
        active ? "text-ink-100" : "text-ink-600 hover:text-ink-200"
      )}
    >
      {active && <ActiveGlow />}
      <Icon size={18} className="relative z-10" />
      <span className="relative z-10 text-[9px]">{item.label}</span>
    </Link>
  );
}

/** Il foglio che si apre tenendo premuta una delle tre schede personalizzabili — sceglie
 * cosa mettere in quello slot tra TUTTE le altre schede, comprese quelle già in barra negli
 * altri due slot: sceglierne una lì scambia le due posizioni invece di lasciarla
 * semplicemente sparire, così ogni scheda in barra resta sempre raggiungibile da qualche
 * parte. Home e Altro non sono mai tra le opzioni: restano fissi, come richiesto. */
function SlotPicker({
  current,
  otherSlots,
  onPick,
  onClose,
}: {
  current: string;
  /** Gli href occupati dagli ALTRI due slot in barra (non lo slot che si sta cambiando) —
   * serve solo per segnalare quali opzioni comportano uno scambio, non per escluderle. */
  otherSlots: string[];
  onPick: (href: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg text-ink-100">Sostituisci scheda</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.href === current;
            const isOtherSlot = otherSlots.includes(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  onPick(item.href);
                  onClose();
                }}
                className={clsx(
                  "focus-ring relative flex flex-col items-center gap-2 rounded-xl2 border py-5 text-center transition",
                  isCurrent ? "border-aura-violet/60 bg-aura-violet/10" : "border-white/10 bg-white/[0.02] hover:border-aura-violet/50"
                )}
              >
                {isOtherSlot && (
                  <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] text-ink-400">
                    <ArrowLeftRight size={9} /> scambia
                  </span>
                )}
                <Icon size={20} className={isCurrent ? "text-aura-violet" : "text-aura-cyan"} />
                <span className="text-xs text-ink-100">{item.label}</span>
                {isCurrent && <Check size={12} className="text-aura-violet" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const { hasUnreadNotification } = useVitaecomSocial();
  const { slots, hydrated, setSlot, swapSlots } = useNavSlots();
  if (HIDDEN_ON.includes(pathname) || HIDDEN_PREFIX_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  const slotItems = slots.map((href) => ALL_NAV_ITEMS.find((i) => i.href === href)).filter((i): i is NavItemDef => Boolean(i));
  const moreItems = ALL_NAV_ITEMS.filter((i) => !slots.includes(i.href));

  const pickForSlot = (href: string) => {
    if (pickingSlot === null) return;
    // Se l'href scelto occupa già un altro slot in barra, le due posizioni si scambiano —
    // altrimenti è una scheda libera (oggi in "Altro") e prende semplicemente il posto.
    const otherIndex = slots.findIndex((s, i) => s === href && i !== pickingSlot);
    if (otherIndex !== -1) swapSlots(pickingSlot, otherIndex);
    else setSlot(pickingSlot, href);
  };

  const moreActive = moreItems.some((m) => pathname.startsWith(m.href));
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const notifDotColor = mood?.color ?? "#B79A6B";

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <motion.div
          key="offline-pill"
          initial={{ opacity: 0, rotateY: -100 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 100 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="glass-nav flex items-center gap-1 rounded-full px-2 py-2 shadow-glass transition-[box-shadow,border-color] duration-1000"
          style={{
            transformPerspective: 700,
            ...(mood
              ? {
                  borderColor: `${mood.color}${Math.round(activeMoodIntensity * 90 + 20)
                    .toString(16)
                    .padStart(2, "0")}`,
                  boxShadow: `0 0 ${14 * activeMoodIntensity}px -2px ${mood.color}aa, inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 40px -12px rgba(0,0,0,0.6)`,
                }
              : {}),
          }}
        >
          <NavButton item={HOME_ITEM} active={pathname.startsWith("/home")} />
          {hydrated &&
            slotItems.map((item, index) => (
              <span key={item.href} className="relative">
                <NavButton item={item} active={pathname.startsWith(item.href)} onLongPress={() => setPickingSlot(index)} />
                {item.href === "/vitaecom" && hasUnreadNotification && (
                  <span
                    className="pointer-events-none absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                    style={{ background: notifDotColor }}
                  />
                )}
              </span>
            ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx(
              "focus-ring relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
              moreActive ? "text-ink-100" : "text-ink-600 hover:text-ink-200"
            )}
          >
            {moreActive && <ActiveGlow />}
            <MoreHorizontal size={18} className="relative z-10" />
            <span className="relative z-10 text-[9px]">Altro</span>
          </button>
        </motion.div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md" onClick={() => setMoreOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-lg text-ink-100">Altro</p>
                <button onClick={() => setMoreOpen(false)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {moreItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="focus-ring flex flex-col items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.02] py-5 text-center transition hover:border-aura-violet/50"
                  >
                    <Icon size={20} className="text-aura-cyan" />
                    <span className="text-xs text-ink-100">{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pickingSlot !== null && (
          <SlotPicker
            current={slots[pickingSlot]}
            otherSlots={slots.filter((_, i) => i !== pickingSlot)}
            onPick={pickForSlot}
            onClose={() => setPickingSlot(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
