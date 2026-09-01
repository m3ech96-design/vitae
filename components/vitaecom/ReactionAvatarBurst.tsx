"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AuraAvatar } from "../ui/AuraAvatar";

const AVATAR_SIZE = 36;
const ICON_SLOT = 18;
const GAP = 12;
// Centro e raggio dell'avatar dentro l'overlay che copre freccia + avatar (le coordinate
// sono quelle esatte del layout qui sotto: freccia larga ICON_SLOT, poi GAP, poi l'avatar).
const CX = ICON_SLOT + GAP + AVATAR_SIZE / 2;
const CY = AVATAR_SIZE / 2;
const R = AVATAR_SIZE / 2;
const START = { x: ICON_SLOT / 2, y: AVATAR_SIZE / 2 };
const EDGE = { x: CX - R, y: CY };

function circlePath(steps: number) {
  // Parte dal bordo sinistro dell'avatar (angolo 180°, lo stesso punto di EDGE) e fa un
  // giro completo — "arriva dritta a filo dell'avatar e girando intorno la sua
  // circonferenza di 360 gradi".
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = Math.PI + (i / steps) * Math.PI * 2;
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });
}

const FLAME_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * Math.PI * 2 + Math.random() * 0.4,
  dist: 22 + Math.random() * 14,
  delay: Math.random() * 0.15,
  white: i % 3 === 0,
}));

/**
 * "L'avatar dell'utente opposto, nella chat, non deve avere aura; ma quando reagisce ad un
 * messaggio si avvia un'animazione..." — l'intera sequenza descritta, in un unico
 * componente che sostituisce sia la freccia indietro sia l'avatar nell'intestazione della
 * conversazione, perché entrambi condividono lo stesso overlay di coordinate: il tasto
 * indietro diventa la sfera di stato d'animo, arriva al bordo dell'avatar, lo gira una
 * volta intera, torna, ridiventa freccia — poi un'aura fiammeggiante esplode intorno
 * all'avatar per un secondo e scompare. ~2-3 secondi in tutto, come richiesto.
 */
export function ReactionAvatarBurst({
  onBack,
  avatarUrl,
  nickname,
  triggerAt,
  moodColor,
}: {
  onBack: () => void;
  avatarUrl?: string;
  nickname: string;
  /** Cambia ogni volta che arriva una nuova reazione (vedi reactionPing nel context) — è il
   * cambiamento di valore, non la sua presenza, ad avviare la sequenza. */
  triggerAt: number | null;
  moodColor: string;
}) {
  const [phase, setPhase] = useState<"idle" | "traveling" | "flaming">("idle");
  const path = useMemo(() => [START, EDGE, ...circlePath(16), START], []);

  useEffect(() => {
    if (!triggerAt) return;
    setPhase("traveling");
    const t1 = setTimeout(() => setPhase("flaming"), 1900);
    const t2 = setTimeout(() => setPhase("idle"), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [triggerAt]);

  return (
    <div className="relative flex shrink-0 items-center" style={{ width: ICON_SLOT + GAP + AVATAR_SIZE, height: AVATAR_SIZE }}>
      <div style={{ width: ICON_SLOT, height: ICON_SLOT }} />
      <div style={{ width: GAP }} />
      <AuraAvatar imageUrl={avatarUrl} firstName={nickname} size={AVATAR_SIZE} ring="none" />

      {/* Il tasto indietro vero, a riposo — sparisce durante il viaggio della sfera. */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.button
            key="arrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
            className="focus-ring absolute left-0 top-0 flex items-center justify-center text-ink-600 hover:text-ink-200"
            style={{ width: ICON_SLOT, height: ICON_SLOT }}
            aria-label="Indietro"
          >
            <ArrowLeft size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* La sfera che viaggia — freccia trasformata, gira intorno all'avatar, torna. */}
      {phase === "traveling" && (
        <motion.span
          initial={{ left: path[0].x, top: path[0].y, opacity: 0, scale: 0.4 }}
          animate={{
            left: path.map((p) => p.x),
            top: path.map((p) => p.y),
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 1, 0.4],
          }}
          transition={{ duration: 1.9, ease: "easeInOut" }}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: moodColor, boxShadow: `0 0 8px 2px ${moodColor}aa` }}
        />
      )}

      {/* L'aura fiammeggiante — un secondo, poi scompare per sempre (non un nuovo respiro
         continuo: è un evento, non lo stato permanente dell'avatar). */}
      {phase === "flaming" && (
        <div className="pointer-events-none absolute" style={{ left: CX, top: CY }}>
          <motion.span
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
            style={{ width: AVATAR_SIZE * 1.6, height: AVATAR_SIZE * 1.6, background: `radial-gradient(circle, ${moodColor}, transparent 70%)` }}
          />
          {FLAME_PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.85, delay: p.delay, ease: "easeOut" }}
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: p.white ? "#fff" : moodColor, boxShadow: `0 0 6px 1px ${p.white ? "#fff" : moodColor}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
