"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Link2Off } from "lucide-react";
import { VitaecomAccount } from "@/lib/vitaecom-social-types";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useHousehold } from "@/lib/household-context";
import { isNightHour } from "@/lib/time";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PlaceIconBadge } from "@/components/ui/PlaceIconBadge";

/**
 * L'avatar di un account Vitaecom nel riquadro Casa/Fuori Casa — stesso linguaggio visivo
 * di HouseholdAvatarCell (una Persona di Mondo), ma qui il tocco apre un piccolo menù invece
 * di una scheda Persona intera: "Vai al profilo" (la sua pagina Vitaecom vera) e "Dissocia
 * dalla Casa" al posto di "Elimina persona" — non è una Persona che l'utente ha creato, è un
 * legame reciproco tra due account che si può sciogliere, non cancellare.
 *
 * Bug reale corretto: il menu e la conferma erano `position: fixed`, ma restavano comunque
 * visivamente intrappolati dentro il riquadro Casa (un `GlassCard`, che applica sempre
 * `overflow-hidden` per gli angoli arrotondati) — su iOS Safari un `overflow: hidden` in un
 * antenato clippa i discendenti `fixed` invece di lasciarli scappare fino al viewport, a
 * differenza del comportamento "da manuale" su desktop. La correzione vera non è una classe
 * CSS in più, è smettere di essere un discendente DOM del riquadro: `createPortal` verso
 * `document.body`, stesso pattern già usato altrove nell'app (AddToHouseholdMenu,
 * PersonalCardSheet) proprio per lo stesso motivo.
 *
 * Corretto secondo le istruzioni: di notte anche un componente della famiglia collegato da
 * Vitaecom risulta dormiente, come già ogni Persona vera (vedi HouseholdAvatarCell) — qui
 * senza la possibilità di "svegliarlo" toccandolo, perché non è un suo orario da decidere
 * per lui: è il suo account, non una Persona che l'utente gestisce.
 */
export function VitaecomHouseholdAvatarCell({ account, location }: { account: VitaecomAccount; location: "casa" | "fuori-casa" }) {
  const router = useRouter();
  const { knownNames, personIdForAccount, dissociateFromHousehold } = useVitaecomSocial();
  const { people } = useHousehold();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [asleep, setAsleep] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const tick = () => setAsleep(isNightHour());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Il nome vero vive ora sulla Persona di Mondo collegata (vedi `vitaecomAccountId`) —
  // `knownNames` resta solo come ripiego per chi l'aveva scritto prima che questo ponte
  // esistesse, così un nome già dato non sparisce dalla vista.
  const linkedPerson = people.find((p) => p.id === personIdForAccount(account.id));
  const name = linkedPerson?.firstName ? { firstName: linkedPerson.firstName, lastName: linkedPerson.lastName } : knownNames[account.id];
  const fullName = name?.firstName ? `${name.firstName} ${name.lastName}`.trim() : account.nickname;

  return (
    <>
      <button type="button" onClick={() => setMenuOpen(true)} className="focus-ring flex flex-col items-center gap-1.5">
        <span className="relative inline-flex">
          <AuraAvatar
            imageUrl={account.avatarUrl}
            firstName={account.nickname}
            size={60}
            ring={asleep ? "sleep" : "home"}
            glowColor={asleep ? undefined : "#B79A6B"}
          />
          {/* Corretto secondo le istruzioni: fuori casa non è più un'aura rossa — resta
             solo un mondo, dato che un account dimostrativo non ha un vero Luogo salvato
             a cui collegare l'icona (vedi lib/vitaecom-household-presence.ts). */}
          {!asleep && location === "fuori-casa" && <PlaceIconBadge place={null} size={60} showWorldFallback />}
        </span>
        <span className="max-w-[64px] truncate text-[11px] text-ink-600">{name?.firstName || account.nickname}</span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {menuOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md" onClick={() => setMenuOpen(false)}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={44} ring="idle" glowColor="#B79A6B" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-100">{fullName}</p>
                      <p className="truncate text-xs text-ink-800">@{account.nickname}</p>
                    </div>
                    <button onClick={() => setMenuOpen(false)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                      <X size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => router.push(`/vitaecom/u/${account.id}`)}
                    className="focus-ring flex w-full items-center gap-2.5 rounded-xl2 border border-white/10 px-4 py-3 text-left text-sm text-ink-200 hover:border-white/20"
                  >
                    <ExternalLink size={15} className="text-ink-600" /> Vai al profilo
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="focus-ring mt-2.5 flex w-full items-center gap-2.5 rounded-xl2 border border-aura-pink/30 bg-aura-pink/[0.05] px-4 py-3 text-left text-sm text-aura-pink hover:bg-aura-pink/[0.1]"
                  >
                    <Link2Off size={15} /> Dissocia dalla casa
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/85 backdrop-blur-md px-6" onClick={() => setConfirmOpen(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-strong w-full max-w-xs rounded-xl3 p-5 text-center"
                >
                  <p className="text-sm text-ink-100">Vuoi davvero dissociare {fullName} da casa?</p>
                  <div className="mt-4 flex gap-2.5">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      className="focus-ring flex-1 rounded-full border border-white/10 py-2.5 text-sm text-ink-200 hover:border-white/25"
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        dissociateFromHousehold(account.id);
                        setConfirmOpen(false);
                      }}
                      className="focus-ring flex-1 rounded-full border border-aura-pink/50 bg-aura-pink/15 py-2.5 text-sm text-ink-100 hover:bg-aura-pink/25"
                    >
                      Sì
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
