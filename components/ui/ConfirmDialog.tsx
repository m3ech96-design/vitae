"use client";
import { AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";

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
  return (
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
    </div>
  );
}
