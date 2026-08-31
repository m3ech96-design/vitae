"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home as HomeIcon, User, Globe2, Users, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";

const ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon, exits: true },
  { href: "/vitaecom/profilo", label: "Profilo", icon: User },
  { href: "/vitaecom", label: "Vitaeworld", icon: Globe2 },
  { href: "/vitaecom/persone", label: "Persone", icon: Users },
  { href: "/vitaecom/chat", label: "Chat", icon: MessageSquare },
];

/** Stesso linguaggio dell'alone condiviso di BottomNav (`layoutId` proprio, diverso dal suo:
 * le due barre non condividono mai lo stesso elemento, sono DOM del tutto separati che si
 * sostituiscono a vicenda — vedi NavSwitcher). */
function ActiveGlow() {
  return (
    <motion.span
      layoutId="online-nav-glow"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-0 rounded-full bg-aura-violet/15 shadow-glow-sm"
    />
  );
}

/**
 * Bug corretto — non era davvero identica alla barra "offline" (vedi BottomNav.tsx):
 * il commento nel codice lo dichiarava ("stessa posizione e dimensione"), ma il markup era
 * stato scritto da zero invece di riusare quello vero. Ora il contenitore, il padding, le
 * dimensioni di icona/etichetta, il vetro più traslucido (`.glass-nav`), la transizione di
 * comparsa e l'alone a scivolo sono tutti nello stesso linguaggio di BottomNav — cambia solo
 * la sequenza di schede (Home/Profilo/Vitaeworld/Persone/Chat), come da richiesta originale,
 * non anche la forma. "Home" non è una scheda di Vitaecom: è l'uscita — porta fuori, dove la
 * barra "offline" riprende da sola (vedi NavSwitcher, che sceglie quale barra mostrare in
 * base al percorso, non in base a uno stato da tenere sincronizzato a mano).
 */
export function OnlineNav() {
  const pathname = usePathname();
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const { hasUnreadNotification } = useVitaecomSocial();
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const notifDotColor = mood?.color ?? "#B79A6B";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <motion.div
        key="online-pill"
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
        {ITEMS.map(({ href, label, icon: Icon, exits }) => {
          const active = !exits && (pathname === href || (href !== "/vitaecom" && pathname.startsWith(href)));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "focus-ring relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
                active ? "text-ink-100" : "text-ink-600 hover:text-ink-200"
              )}
            >
              {active && <ActiveGlow />}
              <Icon size={18} className="relative z-10" />
              {href === "/vitaecom/chat" && hasUnreadNotification && (
                <span
                  className="absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                  style={{ background: notifDotColor }}
                />
              )}
              <span className="relative z-10 text-[9px]">{label}</span>
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
