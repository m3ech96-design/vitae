"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, User, Globe2, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";

const ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon, exits: true },
  { href: "/vitaegram/profilo", label: "Profilo", icon: User },
  { href: "/vitaegram", label: "Vitaeworld", icon: Globe2 },
  { href: "/vitaegram/chat", label: "Chat", icon: MessageSquare },
];

/**
 * Stessa posizione e dimensione della barra "offline" (vedi BottomNav.tsx) — cambia solo la
 * sequenza di schede, come richiesto. "Home" non è una scheda di Vitaegram: è l'uscita — porta
 * fuori, dove la barra "offline" riprende da sola (vedi NavSwitcher, che sceglie quale barra
 * mostrare in base al percorso, non in base a uno stato da tenere sincronizzato a mano).
 */
export function OnlineNav() {
  const pathname = usePathname();
  const { activeMood, allMoods } = useMood();
  const { hasUnreadNotification } = useVitaegramSocial();
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const notifDotColor = mood?.color ?? "#B79A6B";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-void-950/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {ITEMS.map(({ href, label, icon: Icon, exits }) => {
          const active = !exits && (pathname === href || (href !== "/vitaegram" && pathname.startsWith(href)));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "focus-ring relative flex flex-col items-center gap-1 rounded-xl2 px-3 py-1.5 text-[10px] transition-colors",
                active ? "text-ink-100" : "text-ink-800"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} color={active ? "#B79A6B" : undefined} />
              {href === "/vitaegram/chat" && hasUnreadNotification && (
                <span
                  className="absolute right-1.5 top-0.5 h-2 w-2 rounded-full border border-void-950"
                  style={{ background: notifDotColor }}
                />
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
