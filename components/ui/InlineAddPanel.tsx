"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export function InlineAddPanel({
  label,
  canConfirm,
  onConfirm,
  onOpenChange,
  children,
}: {
  label: string;
  canConfirm: boolean;
  onConfirm: () => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const setOpenAndNotify = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpenAndNotify(true)}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3 text-xs text-ink-600 transition hover:border-aura-violet/50 hover:text-ink-200"
      >
        <Plus size={14} /> {label}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-4"
    >
      {children}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpenAndNotify(false)}>
          Annulla
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onConfirm();
            setOpenAndNotify(false);
          }}
          disabled={!canConfirm}
        >
          Aggiungi
        </Button>
      </div>
    </motion.div>
  );
}
