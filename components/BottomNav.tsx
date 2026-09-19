"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, Settings, MoreHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { useMood } from "@/lib/mood-context";
import { usePlaces } from "@/lib/places-context";
import { useFood } from "@/lib/food-context";
import { useLongPress } from "@/lib/use-long-press";
import { ALL_NAV_ITEMS, useNavSlots, NavItemDef } from "@/lib/nav-slots";
import { SlotPicker } from "@/components/nav/SlotPicker";

const HOME_ITEM: NavItemDef = { href: "/home", label: "Home", icon: HomeIcon };
const SETTINGS_ITEM: NavItemDef = { href: "/impostazioni", label: "Impostazioni", icon: Settings };
const HIDDEN_ON = ["/", "/wizard", "/benvenuto", "/tiber"];
const HIDDEN_PREFIX_ON: string[] = [];

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

/**
 * Corretto secondo le istruzioni: la larghezza del pill dipende dalla somma delle etichette
 * dei suoi pulsanti (ciascuno un flex-col icona-sopra-etichetta, largo quanto il più lungo
 * dei due) — non solo dal loro numero. "Impostazioni" (12 lettere) al posto di "Altro" (5)
 * come icona fissa aveva allargato il pill oltre la sua misura precedente, anche senza alcun
 * badge. `showLabel` (di serie true, com'era per ogni pulsante finora) permesso a false per
 * chi non deve contribuire con la propria etichetta alla larghezza — usato solo da
 * Impostazioni qui sotto, l'unico caso in cui la parola è sensibilmente più lunga della norma
 * ed è comunque un'icona già universalmente riconoscibile da sola (un ingranaggio) — non un
 * cambiamento applicato agli altri pulsanti, che restano larghi come sono sempre stati.
 * `aria-label` prende il posto dell'etichetta visibile per chi usa uno screen reader. */
function NavButton({
  item,
  active,
  onLongPress,
  showLabel = true,
}: {
  item: NavItemDef;
  active: boolean;
  onLongPress?: () => void;
  showLabel?: boolean;
}) {
  const { handlers, pressing } = useLongPress(onLongPress ?? (() => {}));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      {...(onLongPress ? handlers : {})}
      onContextMenu={(e) => onLongPress && e.preventDefault()}
      aria-label={showLabel ? undefined : item.label}
      className={clsx(
        "focus-ring relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 transition-all",
        pressing && "scale-90",
        active ? "text-ink-100" : "text-ink-600 hover:text-ink-200"
      )}
    >
      {active && <ActiveGlow />}
      <Icon size={18} className="relative z-10" />
      {showLabel && <span className="relative z-10 text-[9px]">{item.label}</span>}
    </Link>
  );
}

/**
 * Corretto secondo le istruzioni: "Altro" resta, come piccola icona sovrapposta al pill (vedi
 * più sotto) — il pill torna comunque alla sua larghezza precedente (senza il badge, che
 * conta a parte) togliendo l'unica vera causa dell'allargamento: l'etichetta "Impostazioni",
 * più lunga di qualunque altra sempre visibile in barra prima d'ora (vedi `showLabel` sopra).
 */
export function BottomNav() {
  const pathname = usePathname();
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const { hasStalePlaces } = usePlaces();
  const { hasExpiringPantryItems } = useFood();
  const { slots, hydrated, setSlot, swapSlots } = useNavSlots();
  const hidden = HIDDEN_ON.includes(pathname) || HIDDEN_PREFIX_ON.some((prefix) => pathname.startsWith(prefix));

  const slotItems = slots.map((href) => ALL_NAV_ITEMS.find((i) => i.href === href)).filter((i): i is NavItemDef => Boolean(i));
  const moreItems = ALL_NAV_ITEMS.filter((i) => !slots.includes(i.href));
  const moreActive = moreItems.some((m) => pathname.startsWith(m.href));

  const pickForSlot = (href: string) => {
    if (pickingSlot === null) return;
    // Se l'href scelto occupa già un altro slot in barra, le due posizioni si scambiano —
    // altrimenti è una scheda libera e prende semplicemente il posto.
    const otherIndex = slots.findIndex((s, i) => s === href && i !== pickingSlot);
    if (otherIndex !== -1) swapSlots(pickingSlot, otherIndex);
    else setSlot(pickingSlot, href);
  };

  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
            {/* `relative` solo per dare al badge "Altro" qui sotto un riferimento su cui
               ancorarsi — il pill stesso non ne ha bisogno per sé. */}
            <div className="relative">
              <motion.div
                key="offline-pill"
                initial={{ opacity: 0, y: 24, rotateY: -100 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                exit={{ opacity: 0, y: 24, rotateY: 100 }}
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
                      {item.href === "/map" && hasStalePlaces && (
                        <span
                          className="pointer-events-none absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                          style={{ background: "#00E5C7" }}
                        />
                      )}
                      {item.href === "/alimentazione" && hasExpiringPantryItems && (
                        <span
                          className="pointer-events-none absolute right-2 top-1 h-2 w-2 rounded-full border border-void-950"
                          style={{ background: "#FFB454" }}
                        />
                      )}
                    </span>
                  ))}
                {/* Impostazioni resta fissa, ultima della fila, mai riassegnabile con la
                   pressione lunga — esattamente come Home. Senza etichetta (vedi il
                   commento su `showLabel` in NavButton): l'ingranaggio da solo basta a
                   farla riconoscere, e la parola "Impostazioni" era l'unica ragione per
                   cui il pill si era allargato oltre la sua misura di sempre. */}
                <NavButton item={SETTINGS_ITEM} active={pathname.startsWith("/impostazioni")} showLabel={false} />
              </motion.div>

              {/* "Altro" — piccola icona in basso a destra, leggermente sovrapposta al pill,
                 fratello del pill nell'albero React (figlio di questo stesso
                 `<div className="relative">`, non annidato dentro il `<Link>` di
                 Impostazioni su cui visivamente si sovrappone): un tocco qui non risale
                 quindi a nessun antenato con un proprio `onClick` o `href`, lo stesso
                 principio già seguito per HobbyPreviewSheet.tsx e PersonalCardMenu.tsx — la
                 causa reale, in questo progetto, del "tocco un elemento sovrapposto e si
                 attiva anche quello sotto" non è mai la sovrapposizione visiva in sé (il
                 browser consegna il click al solo elemento più in alto nello stacking,
                 `stopPropagation` qui è ridondante ma lasciato per coerenza con lo stesso
                 pattern altrove) — è quasi sempre un elemento annidato dentro un antenato
                 cliccabile, evitato qui per costruzione. */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen(true);
                }}
                aria-label="Altro"
                className={clsx(
                  "focus-ring absolute bottom-0 right-0 z-20 flex h-8 w-8 translate-x-1/3 translate-y-1/3 items-center justify-center rounded-full border backdrop-blur transition",
                  moreActive
                    ? "border-aura-violet/60 bg-void-900/95 text-ink-100 shadow-glow-sm"
                    : "border-white/15 bg-void-900/90 text-ink-400 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6)] hover:border-aura-violet/50 hover:text-ink-100"
                )}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </nav>
        )}
      </AnimatePresence>

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
