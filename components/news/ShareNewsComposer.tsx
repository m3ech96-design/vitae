"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { NewsItem } from "@/app/api/news/route";

/**
 * Condividere una news su Vitaecom — non un post che finge di essere tuo: incorpora il
 * link vero (lo stesso `LinkEmbed` già usato per qualunque link scritto in un post,
 * nessun componente nuovo) insieme a un tuo commento facoltativo, e rimanda sempre alla
 * fonte per l'articolo intero.
 */
export function ShareNewsComposer({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const { publish } = useVitaecomSocial();
  const [text, setText] = useState("");

  const submit = () => {
    const caption = `${text.trim() ? `${text.trim()}\n\n` : ""}${item.title}\n${item.link}`;
    publish({ caption, tags: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Condividi</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="line-clamp-2 text-sm text-ink-200">{item.title}</p>
            <p className="mt-1 truncate text-[11px] text-ink-800">{item.link}</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Aggiungi un pensiero (facoltativo)…"
            rows={3}
            className="focus-ring mt-3 w-full resize-none rounded-xl2 border border-white/10 bg-white/[0.03] p-3.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <button
            onClick={submit}
            className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-aura-gradient py-3 text-sm font-display text-void-950 shadow-glow"
          >
            <Send size={15} /> Condividi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
