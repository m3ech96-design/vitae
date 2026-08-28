"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home as HomeIcon,
  ListChecks,
  MapPinned,
  Users,
  MoreHorizontal,
  HeartPulse,
  Wallet,
  Sparkles,
  Aperture,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";

const MAIN_ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/task", label: "Task", icon: ListChecks },
  { href: "/vitaegram", label: "Vitaegram", icon: Aperture },
  { href: "/mondo", label: "Mondo", icon: Users },
];

const MORE_ITEMS = [
  { href: "/salute", label: "Salute", icon: HeartPulse, enabled: true },
  { href: "/finanze", label: "Finanze", icon: Wallet, enabled: true },
  { href: "/rapporti", label: "Rapporti", icon: Sparkles, enabled: true },
  { href: "/map", label: "Mappa", icon: MapPinned, enabled: true },
];

const HIDDEN_ON = ["/", "/wizard"];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const { hasUnreadNotification } = useVitaegramSocial();
  if (HIDDEN_ON.includes(pathname)) return null;

  const moreActive = MORE_ITEMS.some((m) => m.enabled && pathname.startsWith(m.href));
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const notifDotColor = mood?.color ?? "#B79A6B";

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div
          className="glass-strong flex items-center gap-1 rounded-full px-2 py-2 shadow-glass transition-[box-shadow,border-color] duration-1000"
          style={
            mood
              ? {
                  borderColor: `${mood.color}${Math.round(activeMoodIntensity * 90 + 20)
                    .toString(16)
                    .padStart(2, "0")}`,
                  boxShadow: `0 0 ${14 * activeMoodIntensity}px -2px ${mood.color}aa, inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 40px -12px rgba(0,0,0,0.6)`,
                }
              : undefined
          }
        >
          {MAIN_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "focus-ring relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
                  active ? "bg-aura-violet/15 text-ink-100 shadow-glow-sm" : "text-ink-600 hover:text-ink-200"
                )}
              >
                <Icon size={18} />
                {href === "/vitaegram" && hasUnreadNotification && (
                  <span
                    className="absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                    style={{ background: notifDotColor }}
                  />
                )}
                <span className="text-[9px]">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx(
              "focus-ring flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
              moreActive ? "bg-aura-violet/15 text-ink-100 shadow-glow-sm" : "text-ink-600 hover:text-ink-200"
            )}
          >
            <MoreHorizontal size={18} />
            <span className="text-[9px]">Altro</span>
          </button>
        </div>
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
                {MORE_ITEMS.map(({ href, label, icon: Icon, enabled }) =>
                  enabled ? (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className="focus-ring flex flex-col items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.02] py-5 text-center transition hover:border-aura-violet/50"
                    >
                      <Icon size={20} className="text-aura-cyan" />
                      <span className="text-xs text-ink-100">{label}</span>
                    </Link>
                  ) : (
                    <span
                      key={href}
                      className="flex flex-col items-center gap-2 rounded-xl2 border border-white/[0.06] py-5 text-center opacity-40"
                    >
                      <Icon size={20} className="text-ink-600" />
                      <span className="text-xs text-ink-600">{label}</span>
                      <span className="text-[9px] uppercase tracking-wide text-ink-800">Presto</span>
                    </span>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
