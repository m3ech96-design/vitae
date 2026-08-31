"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { VitaecomAccount, VitaecomPost } from "@/lib/vitaecom-social-types";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { ShowcaseDrawer } from "./ShowcaseDrawer";
import { ExploreProfileSheet } from "./ExploreProfileSheet";
import { KnowPanel } from "./KnowPanel";

const UNKNOWN_TIP_MS = 5000;

export function ProfileHeader({
  account,
  isOwner,
  posts,
  collapseProgress = 0,
}: {
  account: VitaecomAccount;
  isOwner: boolean;
  posts: VitaecomPost[];
  /** Solo per un profilo altrui (vedi CollapsedProfileBar nella pagina): 0 in cima, 1
   * quando il riquadro in alto ha preso il posto di vetrina/avatar/nickname. L'owner non lo
   * passa mai — il suo profilo non si raccoglie durante lo scroll. */
  collapseProgress?: number;
}) {
  const router = useRouter();
  const { activeMood, activeMoodIntensity, allMoods, shareMoodOnVitaecom } = useMood();
  const { knownAccountIds } = useVitaecomSocial();
  const known = knownAccountIds.includes(account.id);

  const normale = allMoods.find((m) => m.id === "normale");

  // Per l'owner, lo stato d'animo è quello vero e attuale (se condiviso — vedi il pop-up
  // "Ti Senti Così?"). Per chiunque altro non esiste alcun "stato attuale" tracciato in
  // tempo reale (solo l'utente vero ha un `activeMood`): il segnale più onesto che l'app ha
  // davvero è lo stato d'animo del suo post più recente, non un dato inventato.
  let moodId: string;
  if (isOwner) {
    moodId = shareMoodOnVitaecom ? activeMood?.moodId ?? "normale" : "normale";
  } else {
    const ownPosts = posts.filter((p) => p.authorId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    moodId = ownPosts[0]?.moodId ?? "normale";
  }
  const mood = allMoods.find((m) => m.id === moodId) ?? normale;
  // Stessa convenzione già stabilita in Home (vedi app/home/page.tsx, displayIntensity):
  // solo un vero stato d'animo attivo dell'owner respira davvero nell'arco delle 12 ore —
  // il ripiego "Normale", o lo stato dedotto dall'ultimo post di un altro account, restano
  // a un'intensità fissa e tranquilla, non un battito a caso.
  const auraIntensityValue = isOwner && activeMood && shareMoodOnVitaecom ? activeMoodIntensity : 0.4;

  const [exploreOpen, setExploreOpen] = useState(false);
  const [unknownTipOpen, setUnknownTipOpen] = useState(false);
  const [unknownTipPos, setUnknownTipPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const unknownTipTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setMounted(true), []);

  const handleAvatarClick = () => {
    if (isOwner) {
      router.push("/profilo");
      return;
    }
    if (known) return;
    // "Non Conosci Ancora Questa Persona" — ancorata all'avatar, si chiude da sola dopo 5
    // secondi (o subito, se tocchi di nuovo l'avatar). Stessa tecnica del portal già usata
    // per il pannello "Esplora Altro", per non farsi tagliare dalla card che scorre.
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    setUnknownTipPos({ top: rect.bottom + 10, left: Math.max(8, Math.min(rect.left, window.innerWidth - 220 - 8)) });
    setUnknownTipOpen(true);
    if (unknownTipTimer.current) clearTimeout(unknownTipTimer.current);
    unknownTipTimer.current = setTimeout(() => setUnknownTipOpen(false), UNKNOWN_TIP_MS);
  };

  useEffect(() => () => unknownTipTimer.current && clearTimeout(unknownTipTimer.current), []);

  return (
    <div>
      <div style={{ opacity: Math.max(0, 1 - collapseProgress * 1.6) }}>
        <ShowcaseDrawer isOwner={isOwner} account={!isOwner ? account : undefined} />
      </div>

      <div
        className="mt-7 flex flex-col items-center px-5 sm:px-6"
        style={{
          transform: `scale(${1 - collapseProgress * 0.55})`,
          transformOrigin: "top center",
          opacity: Math.max(0, 1 - collapseProgress * 1.7),
        }}
      >
        <span className="relative inline-flex">
          {!isOwner && (
            <button
              onClick={() => setExploreOpen(true)}
              className="focus-ring absolute -left-1.5 -top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-void-900/90 text-ink-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6)] backdrop-blur transition hover:border-[#B79A6B]/50 hover:text-ink-100"
              aria-label={`Esplora altro su ${account.nickname}`}
            >
              <MoreHorizontal size={14} />
            </button>
          )}
          <button
            ref={avatarRef}
            onClick={handleAvatarClick}
            className="focus-ring relative rounded-full"
            aria-label={isOwner ? "Il tuo profilo completo" : known ? account.nickname : "Non conosci ancora questa persona"}
          >
            {/* L'aura scompare prima che l'avatar finisca di rimpicciolirsi (vedi
               requisito: "man mano che l'avatar si avvicina alla posizione finale...
               l'aura scompare"), non insieme a lui — da qui l'intensità che cala più in
               fretta della sua opacità generale. */}
            <AuraAvatar
              imageUrl={account.avatarUrl}
              firstName={account.nickname}
              size={92}
              ring="idle"
              glowColor={mood?.color}
              glowIntensity={auraIntensityValue * Math.max(0, 1 - collapseProgress * 1.8)}
            />
          </button>
        </span>

        <p className="mt-3.5 font-display text-lg text-ink-100">@{account.nickname}</p>

        {mood && (
          <p className="mt-1 text-xs" style={{ color: mood.color }}>
            {mood.label}
          </p>
        )}
      </div>

      {/* Non subito sotto la riga di stato, ma nemmeno lontano — il "riquadro centrale"
         (vedi KnowPanel) che decide se sei "Persona Conosciuta" o "Sconosciuto" per questo
         account, e cosa puoi farci. Solo sui profili altrui: il tuo non ha bisogno di
         dichiarare se conosci te stesso. */}
      {!isOwner && (
        <div className="mt-5" style={{ opacity: Math.max(0, 1 - collapseProgress * 1.7) }}>
          <KnowPanel accountId={account.id} />
        </div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {unknownTipOpen && unknownTipPos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: unknownTipPos.top, left: unknownTipPos.left, width: 220 }}
                className="glass-strong z-50 rounded-xl2 px-3.5 py-3 text-center text-xs text-ink-200"
              >
                Non conosci ancora questa persona
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {exploreOpen && <ExploreProfileSheet nickname={account.nickname} onClose={() => setExploreOpen(false)} />}
    </div>
  );
}
