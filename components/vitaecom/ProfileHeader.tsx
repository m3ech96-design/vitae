"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Compass } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { useHousehold } from "@/lib/household-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { VitaecomAccount, VitaecomPost } from "@/lib/vitaecom-social-types";
import { latestDiscoveries } from "@/lib/vitaecom-discoveries";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { ShowcaseDrawer } from "./ShowcaseDrawer";
import { ExploreProfileSheet } from "./ExploreProfileSheet";

const MENU_WIDTH = 240;

export function ProfileHeader({
  account,
  isOwner,
  posts,
}: {
  account: VitaecomAccount;
  isOwner: boolean;
  posts: VitaecomPost[];
}) {
  const router = useRouter();
  const { profile } = useProfile();
  const { activeMood, activeMoodIntensity, allMoods, shareMoodOnVitaecom } = useMood();
  const { people } = useHousehold();
  const { accountLinks } = useVitaecomSocial();

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

  const linkedPersonId = isOwner ? undefined : accountLinks[account.id];
  const linkedPerson = linkedPersonId ? people.find((p) => p.id === linkedPersonId) : undefined;
  const gender = isOwner ? profile.gender : linkedPerson?.gender;

  const [discoveriesOpen, setDiscoveriesOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Stessa correzione della card personale offline (vedi PersonalCardMenu): il pop-up esce
  // dal DOM del profilo con un portal, così niente può più tagliarlo — qui, in più, la card
  // del profilo scorre parecchio più di quella di Home, quindi era anche più probabile
  // capitasse.
  useLayoutEffect(() => {
    if (!discoveriesOpen) return;
    const position = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      // "In basso a destra dell'avatar": l'ancora parte da un po' oltre il centro
      // dell'avatar ed estende verso destra, non semplicemente centrata sotto di lui.
      const left = Math.max(8, Math.min(rect.left + rect.width * 0.6, window.innerWidth - MENU_WIDTH - 8));
      setMenuPos({ top: rect.bottom + 10, left });
    };
    position();
    const close = () => setDiscoveriesOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", position);
    };
  }, [discoveriesOpen]);

  useEffect(() => {
    if (!discoveriesOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setDiscoveriesOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [discoveriesOpen]);

  const handleAvatarClick = () => {
    if (isOwner) {
      router.push("/profilo");
      return;
    }
    setDiscoveriesOpen((v) => !v);
  };

  const recent = linkedPerson ? latestDiscoveries(linkedPerson, 3) : [];

  return (
    <div>
      {isOwner && <ShowcaseDrawer isOwner />}

      <div className="mt-7 flex flex-col items-center">
        <button ref={triggerRef} onClick={handleAvatarClick} className="focus-ring relative rounded-full" aria-label={isOwner ? "Il Tuo Profilo Completo" : `Ultime Scoperte Su ${account.nickname}`}>
          <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={92} ring="idle" glowColor={mood?.color} glowIntensity={auraIntensityValue} />
        </button>

        <p className="mt-3.5 font-display text-lg text-ink-100">@{account.nickname}</p>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
          {gender && <span>{gender}</span>}
          {gender && mood && <span className="h-1 w-1 shrink-0 rounded-full bg-ink-800" />}
          {mood && <span style={{ color: mood.color }}>{mood.label}</span>}
        </p>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {discoveriesOpen && menuPos && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
                className="glass-strong z-50 overflow-hidden rounded-xl2 p-1.5"
              >
                <p className="px-3 pt-2 text-[10px] uppercase tracking-wide text-ink-800">
                  Ultime Scoperte Su {account.nickname}
                </p>
                {!linkedPerson ? (
                  <p className="px-3 py-3 text-xs text-ink-800">
                    Non Hai Ancora Collegato @{account.nickname} A Nessuna Persona — Tocca &quot;Esplora Altro&quot; Per
                    Farlo.
                  </p>
                ) : recent.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-ink-800">Non Hai Ancora Scoperto Nulla.</p>
                ) : (
                  recent.map((d, i) => (
                    <div key={i} className="flex items-start gap-1 px-3 py-2 text-xs">
                      <span className="text-ink-600">{d.label}</span>
                      <span className="ml-auto text-right text-ink-200">{d.value}</span>
                    </div>
                  ))
                )}
                <button
                  onClick={() => {
                    setDiscoveriesOpen(false);
                    setExploreOpen(true);
                  }}
                  className="focus-ring mt-1 flex w-full items-center gap-2 rounded-xl border-t border-white/[0.06] px-3 py-2.5 text-left text-xs text-[#B79A6B] hover:bg-white/[0.04]"
                >
                  <Compass size={13} /> Esplora Altro <ChevronRight size={13} className="ml-auto" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {exploreOpen && (
        <ExploreProfileSheet accountId={account.id} nickname={account.nickname} onClose={() => setExploreOpen(false)} />
      )}
    </div>
  );
}
