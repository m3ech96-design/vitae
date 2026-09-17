"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Pencil } from "lucide-react";
import { PhotoGallery } from "./PhotoGallery";

/**
 * Vetrina di sola consultazione per una voce con foto — usata ovunque un tocco su una card
 * (un libro in Libreria, un pezzo in Inventario, un progetto, una partita...) aprisse finora
 * DIRETTAMENTE il modulo di modifica, senza modo di limitarsi a guardare: prima si toccava
 * la copertina e ci si ritrovava dentro il wizard di modifica, con la recensione/nota tagliata
 * a poche righe. Corretto secondo le istruzioni: il tocco apre invece questa finestra —
 * l'immagine mostrata per intero (mai ritagliata, stesso principio già in uso nella galleria
 * dei luoghi, vedi PhotoGallery), i campi sotto in sola lettura, e la matita in alto per chi
 * vuole davvero aprire il wizard e modificare — la stessa icona già usata altrove nell'app
 * (Wishlist, finestra di un luogo) per lo stesso scopo, non una nuova convenzione isolata.
 *
 * Un solo componente condiviso invece di quattro copie quasi identiche (Libreria, Inventario,
 * Progetti, Partite) — chi lo usa passa solo cosa cambia: titolo, foto e campi.
 */
export function ItemDetailSheet({
  title,
  photoKeys = [],
  onEdit,
  onClose,
  children,
}: {
  title: string;
  /** Una o più foto da mostrare per intero nell'header. Vuoto: niente header foto, solo
   * titolo — non ha senso riservare uno spazio a un'immagine che non c'è. */
  photoKeys?: string[];
  onEdit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const hasPhoto = photoKeys.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        {hasPhoto && (
          <div className="relative z-10 w-full shrink-0" style={{ height: 240 }}>
            <PhotoGallery photoKeys={photoKeys} height={240} bordered={false} />
            <button
              onClick={onClose}
              className="focus-ring absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-void-950/70 text-ink-100"
              aria-label="Chiudi"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="shrink-0 flex items-start justify-between gap-3 px-6 pt-6">
          <p className="min-w-0 flex-1 break-words font-display text-lg text-ink-100">{title}</p>
          <div className="flex shrink-0 items-center gap-3 pt-0.5">
            <button onClick={onEdit} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Modifica">
              <Pencil size={16} />
            </button>
            {!hasPhoto && (
              <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
      </motion.div>
    </div>,
    document.body
  );
}

/** Un campo in sola lettura dentro la vetrina — coerente con lo stile già usato in
 * WishlistItemSheet ("Altri dettagli") invece di inventarne uno nuovo. Non si mostra da solo
 * quando il valore manca, così chi lo usa può passare tutti i campi possibili senza dover
 * controllare ogni volta se sono valorizzati. */
export function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">{label}</p>
      <div className="mt-1 text-sm text-ink-100">{value}</div>
    </div>
  );
}
