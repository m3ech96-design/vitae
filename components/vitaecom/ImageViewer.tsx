"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Gem, MessageCircle, Share2 } from "lucide-react";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useMood } from "@/lib/mood-context";
import { AuraAvatar } from "../ui/AuraAvatar";

/** Palette "tipo inverno" per gli aloni ai margini — ghiaccio, non i violetti/ciano
 * dell'Aura usuale dell'app: qui è lo sfondo di un'immagine, deve restare dietro, non
 * competere con la foto al centro. */
const WINTER_HALOS = ["#8ECAE6", "#A8DADC", "#DDE6F7", "#ADB9E3", "#C9E4F6", "#B8D8D8"];

type Edge = "top" | "bottom" | "left" | "right";
const EDGES: Edge[] = ["top", "bottom", "left", "right"];
const PER_EDGE = 7;

interface Halo {
  id: string;
  edge: Edge;
  offsetPct: number;
  inset: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftA: number;
  driftB: number;
}

/**
 * "Decine di aloni... che si mischiano tra loro in modo animato... come vapori di colore",
 * lungo ogni lato — non i 4 cerchi fissi sul solo lato destro che c'erano prima (uno stub
 * mai completato). Generati proceduralmente (28 in tutto, 7 per lato) invece di scritti a
 * mano uno per uno: posizione, fase e velocità leggermente irregolari per ognuno, così il
 * movimento non sembra un pattern che si ripete a specchio. Ogni figura resta dentro una
 * fascia stretta vicino al proprio bordo (mai oltre un ~16% di margine verso il centro) e a
 * opacità bassa: molte macchie sfocate e trasparenti che si sovrappongono leggono come
 * fumo/vapore che si mescola, non come cerchi distinti — e restando confinate ai margini,
 * mai sopra la foto al centro, non diventano mai invadenti.
 */
function buildHalos(): Halo[] {
  const halos: Halo[] = [];
  let seed = 0;
  for (const edge of EDGES) {
    for (let i = 0; i < PER_EDGE; i++) {
      seed++;
      halos.push({
        id: `${edge}-${i}`,
        edge,
        offsetPct: (i / PER_EDGE) * 100 + ((seed * 13) % 11),
        inset: -8 + ((seed * 7) % 10),
        size: 22 + ((seed * 5) % 16),
        color: WINTER_HALOS[seed % WINTER_HALOS.length],
        duration: 15 + ((seed * 3) % 12),
        delay: (seed % 9) * 0.9,
        driftA: seed % 2 === 0 ? 16 + (seed % 5) : -(16 + (seed % 5)),
        driftB: seed % 3 === 0 ? 12 + (seed % 4) : -(12 + (seed % 4)),
      });
    }
  }
  return halos;
}

function HaloLayer() {
  const halos = useMemo(buildHalos, []);
  return (
    <>
      {halos.map((h) => {
        const base: React.CSSProperties = {
          position: "absolute",
          width: `${h.size}vh`,
          height: `${h.size}vh`,
          background: h.color,
          borderRadius: "9999px",
        };
        if (h.edge === "top" || h.edge === "bottom") {
          base.left = `${h.offsetPct}%`;
          base.transform = "translateX(-50%)";
          base[h.edge] = `${h.inset}vh`;
        } else {
          base.top = `${h.offsetPct}%`;
          base.transform = "translateY(-50%)";
          base[h.edge] = `${h.inset}vw`;
        }
        const isHorizontalEdge = h.edge === "top" || h.edge === "bottom";
        return (
          <motion.div
            key={h.id}
            className="pointer-events-none absolute rounded-full blur-[75px]"
            style={base}
            animate={
              isHorizontalEdge
                ? { x: [0, h.driftA, 0, -h.driftA, 0], opacity: [0.1, 0.2, 0.13, 0.19, 0.1] }
                : { y: [0, h.driftB, 0, -h.driftB, 0], opacity: [0.1, 0.2, 0.13, 0.19, 0.1] }
            }
            transition={{ duration: h.duration, repeat: Infinity, ease: "easeInOut", delay: h.delay }}
          />
        );
      })}
    </>
  );
}

/**
 * Il visualizzatore a schermo intero di un'immagine di Vitaecom — buio, con aloni di colore
 * che si muovono in loop lungo tutti e quattro i margini (il Lato Stato qui non compare più,
 * su richiesta esplicita), l'immagine al centro zoomabile senza uno scatto di ritorno (resta
 * dove la lasci, anche chiudendo e riaprendo — non è un dettaglio da nascondere: lo zoom vive
 * solo per questa apertura, non è persistito), e una finestra in basso, che appare toccando
 * lo schermo, con le informazioni del post.
 */
export function ImageViewer({
  post,
  photoUrl,
  userAccount,
  onOpenComments,
  onShare,
  onClose,
}: {
  post: VitaecomPost;
  photoUrl: string;
  userAccount: { id: string; nickname: string; avatarUrl?: string };
  onOpenComments: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const { allMoods } = useMood();
  const [infoOpen, setInfoOpen] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragging = useRef(false);

  const account = resolveAccount(post.authorId, userAccount);
  const mood = allMoods.find((m) => m.id === (post.sharedMoodId ?? post.moodId));

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStart.current = { dist, scale };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const nextScale = Math.min(6, Math.max(1, pinchStart.current.scale * (dist / pinchStart.current.dist)));
      setScale(nextScale);
      dragging.current = true;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    // Un tocco breve (non un pizzico, non un trascinamento) apre/chiude la finestra
    // informazioni — non deve scattare se stavi zoomando o trascinando l'immagine.
    if (!dragging.current && pointers.current.size === 0) setInfoOpen((v) => !v);
    setTimeout(() => (dragging.current = false), 50);
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(6, Math.max(1, s - e.deltaY * 0.0015)));
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
      <HaloLayer />

      <div className="relative h-full w-full">
        <button
          onClick={onClose}
          className="focus-ring glass-strong absolute right-4 top-[max(env(safe-area-inset-top),0.9rem)] z-20 flex h-9 w-9 items-center justify-center rounded-full text-ink-200"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>

        <div
          className="flex h-full w-full touch-none items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt=""
            className="max-h-full max-w-full select-none object-contain"
            style={{ transform: `scale(${scale})`, transformOrigin: `${origin.x}% ${origin.y}%`, transition: pinchStart.current ? "none" : "transform 0.05s linear" }}
            draggable={false}
          />
        </div>

        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong absolute inset-x-0 bottom-0 z-20 rounded-t-xl3 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4"
            style={{ backdropFilter: "blur(28px) saturate(190%)" }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/15" />
            <div className="mt-3 flex items-center gap-2.5">
              <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={30} ring="idle" glowColor={mood?.color} />
              <span className="text-sm text-ink-100">{account.nickname}</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Gem size={17} color={mood?.color ?? "#8B90A8"} strokeWidth={1.6} />
              <button onClick={onOpenComments} className="focus-ring">
                <MessageCircle size={17} color={mood?.color ?? "#8B90A8"} strokeWidth={1.6} />
              </button>
              <button onClick={onShare} className="focus-ring">
                <Share2 size={16} color="#8B90A8" strokeWidth={1.6} />
              </button>
            </div>
            {post.caption && (
              <div className="mt-2.5">
                <p className={captionExpanded ? "max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink-200" : "line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-200"}>
                  {post.caption}
                </p>
                {!captionExpanded && post.caption.length > 90 && (
                  <button
                    onClick={() => setCaptionExpanded(true)}
                    className="focus-ring mt-1 text-xs text-ink-600 hover:text-ink-300"
                  >
                    Espandi
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>,
    document.body
  );
}

