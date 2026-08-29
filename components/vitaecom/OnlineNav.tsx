"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, User, Globe2, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";

const ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon, exits: true },
  { href: "/vitaecom/profilo", label: "Profilo", icon: User },
  { href: "/vitaecom", label: "Vitaeworld", icon: Globe2 },
  { href: "/vitaecom/chat", label: "Chat", icon: MessageSquare },
];

/**
 * Bug corretto — non era davvero identica alla barra "offline" (vedi BottomNav.tsx):
 * il commento lo dichiarava ("stessa posizione e dimensione") ma il markup era un altro,
 * scritto da zero invece di riusare quello vero — una barra piena larghezza, ancorata
 * al fondo con un bordo superiore, senza la forma a pillola fluttuante; icone da 20px
 * invece di 18, etichette da 10px invece di 9, e una scheda attiva segnata solo da un
 * cambio di colore del testo invece della pillola violetta con bagliore. Ora il
 * contenitore, il padding, le dimensioni di icona/etichetta e lo stato attivo sono
 * ricopiati esattamente da BottomNav — cambia solo la sequenza di schede, come
 * richiesto. "Home" non è una scheda di Vitaecom: è l'uscita — porta fuori, dove la
 * barra "offline" riprende da sola (vedi NavSwitcher, che sceglie quale barra mostrare
 * in base al percorso, non in base a uno stato da tenere sincronizzato a mano).
 */
export function OnlineNav() {
  const pathname = usePathname();
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const { hasUnreadNotification } = useVitaecomSocial();
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const notifDotColor = mood?.color ?? "#B79A6B";

  return (
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
        {ITEMS.map(({ href, label, icon: Icon, exits }) => {
          const active = !exits && (pathname === href || (href !== "/vitaecom" && pathname.startsWith(href)));
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
              {href === "/vitaecom/chat" && hasUnreadNotification && (
                <span
                  className="absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                  style={{ background: notifDotColor }}
                />
              )}
              <span className="text-[9px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
