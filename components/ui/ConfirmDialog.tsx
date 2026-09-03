"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";

/**
 * Bug reale, ripetuto più volte in giro per l'app (Animali, Alimentazione, Hobby...): un
 * `GlassCard` applica sempre `overflow-hidden` per i propri angoli arrotondati, e un
 * discendente `position: fixed` dentro un antenato con `overflow-hidden` (o `transform`,
 * stessa causa già trovata una volta per PersonalCardSheet.tsx) smette di essere relativo al
 * viewport su iOS Safari — resta invece schiacciato dentro il bordo di quell'antenato.
 * `ConfirmDialog` è condiviso da moltissimi punti diversi dell'app, non tutti dentro un
 * `GlassCard`: piuttosto che verificare ogni punto uno per uno (fragile, è esattamente come
 * questo bug si è ripetuto), esce sempre dal DOM con un portal su `document.body` — corretto
 * ovunque per costruzione, non solo dove segnalato.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Elimina",
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-void-950/90 p-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="glass-strong w-full max-w-xs rounded-xl3 p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aura-pink/15">
            <AlertTriangle size={18} className="text-aura-pink" />
          </span>
          <button onClick={onCancel} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Annulla">
            <X size={16} />
          </button>
        </div>
        <p className="font-display text-base text-ink-100">{title}</p>
        {description && <p className="mt-1.5 text-sm text-ink-600">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
