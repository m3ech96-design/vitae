"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { GenealogyFamily } from "@/lib/genealogy-types";
import { genealogyFullName } from "@/lib/genealogy-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { GenealogyPersonModal } from "./GenealogyPersonModal";

/**
 * Crea o rinomina un segnalibro Famiglia — solo nome + persona di riferimento, come da
 * decisione architetturale (lib/genealogy-types.ts): non contiene relazioni proprie.
 */
export function GenealogyFamilyModal({ family, onClose }: { family?: GenealogyFamily; onClose: () => void }) {
  const { people, addFamily, updateFamily } = useGenealogy();
  const [name, setName] = useState(family?.name ?? "");
  const [referencePersonId, setReferencePersonId] = useState(family?.referencePersonId ?? people[0]?.id ?? "");
  const [creatingPerson, setCreatingPerson] = useState(false);

  const canSave = name.trim().length > 0 && Boolean(referencePersonId);

  const submit = () => {
    if (!canSave) return;
    if (family) updateFamily(family.id, { name: name.trim(), referencePersonId });
    else addFamily({ name: name.trim(), referencePersonId });
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (creatingPerson) {
    return (
      <GenealogyPersonModal
        onSaved={(id) => {
          setReferencePersonId(id);
          setCreatingPerson(false);
        }}
        onClose={() => setCreatingPerson(false)}
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{family ? "Rinomina famiglia" : "Nuova famiglia"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Nome della famiglia" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Famiglia Rossi" />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Persona di riferimento</p>
            {people.length > 0 && (
              <select
                value={referencePersonId}
                onChange={(e) => setReferencePersonId(e.target.value)}
                className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id} className="bg-void-800">{genealogyFullName(p)}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setCreatingPerson(true)}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-aura-cyan hover:border-aura-cyan/50"
            >
              <Plus size={13} /> Crea una nuova persona
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {family ? "Salva modifiche" : "Crea famiglia"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
