"use client";
import { useState } from "react";
import { FolderPlus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { capitalizeWords } from "@/lib/text";
import { Button } from "../ui/Button";

export function CreateSectionControl({ onCreate }: { onCreate: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const confirm = () => {
    const t = capitalizeWords(title.trim());
    if (!t) return;
    onCreate(t);
    setTitle("");
    setOpen(false);
  };

  return (
    <div className="mt-2 border-t border-white/[0.06] pt-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-aura-cyan/30 bg-aura-cyan/[0.04] py-3.5 font-display text-sm text-ink-200 transition hover:border-aura-cyan/60 hover:shadow-glow-cyan"
        >
          <FolderPlus size={16} /> Crea Sezione
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-xl2 border border-aura-cyan/30 bg-white/[0.03] p-4"
        >
          <label className="block">
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Nome Della Nuova Sezione
            </span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              placeholder="Es. Vita Privata"
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 placeholder:text-ink-800"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X size={14} /> Annulla
            </Button>
            <Button size="sm" onClick={confirm} disabled={!title.trim()}>
              <Check size={14} /> Crea
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
