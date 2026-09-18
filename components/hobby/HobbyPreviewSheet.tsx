"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Hobby } from "@/lib/hobby-types";
import { summarizeBlock } from "@/lib/hobby-stats";
import { HOBBY_BLOCK_ICONS } from "@/lib/hobby-block-meta";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { Button } from "../ui/Button";

function CoverPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-ink-800">
        <Sparkles size={28} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

/**
 * Anteprima che si apre toccando un hobby dalla scheda, PRIMA di entrare nella pagina vera —
 * richiesta esplicitamente come tappa intermedia: immagine grande incorniciata, titolo,
 * resoconto di cosa contiene ogni blocco, e solo in fondo "Entra" per aprire davvero
 * `/hobby/[id]`. Stesso guscio (portal su document.body, spring, `dvh` per la tastiera) già
 * usato da AddHobbyModal.tsx per la stessa scheda — qui con un piede fisso in fondo per il
 * pulsante "Entra", invece di un'unica area scorribile, perché deve restare raggiungibile
 * anche con molti blocchi da elencare sopra.
 *
 * Reso come fratello, non genitore, del pulsante che lo apre (vedi HobbyCard.tsx) — nessun
 * `stopPropagation` necessario sullo sfondo: a differenza del caso corretto in
 * PersonalCardSheet.tsx, qui non c'è un antenato comune con un proprio onClick da cui la
 * risalita degli eventi React (che segue l'albero React, non il DOM reale nonostante il
 * portal) potrebbe far scattare un doppio apri.
 */
export function HobbyPreviewSheet({ hobby, onClose }: { hobby: Hobby; onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const enter = () => {
    onClose();
    router.push(`/hobby/${hobby.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[88dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex justify-end px-5 pt-5">
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 pt-1">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-xl text-ink-100">{hobby.name}</h2>
            <div className="mt-4 h-36 w-36 overflow-hidden rounded-xl3 ring-1 ring-white/15 shadow-glow-sm">
              <CoverPhoto photoKey={hobby.photoKey} />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Cosa c&apos;è dentro</p>
            {hobby.blocks.length === 0 ? (
              <p className="rounded-xl2 border border-dashed border-white/10 px-4 py-5 text-center text-xs text-ink-600">
                Ancora nessun blocco — entra per aggiungere il primo.
              </p>
            ) : (
              <div className="space-y-1.5">
                {hobby.blocks.map((block) => {
                  const Icon = HOBBY_BLOCK_ICONS[block.kind];
                  return (
                    <div key={block.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-aura-cyan">
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink-100">{block.title}</p>
                        <p className="truncate text-[11px] text-ink-600">{summarizeBlock(block)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={enter}>
            Entra <ArrowRight size={15} />
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
