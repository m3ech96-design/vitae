"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { MetricBlock, MetricDirection, MetricAggregation } from "@/lib/hobby-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";

export function MetricConfigModal({ hobbyId, block, onClose }: { hobbyId: string; block: MetricBlock; onClose: () => void }) {
  const { updateMetricConfig } = useHobby();
  const [unit, setUnit] = useState(block.unit);
  const [direction, setDirection] = useState<MetricDirection>(block.direction);
  const [aggregation, setAggregation] = useState<MetricAggregation>(block.aggregation);
  const [goalValue, setGoalValue] = useState(block.goalValue !== undefined ? String(block.goalValue) : "");
  const [goalDeadline, setGoalDeadline] = useState(block.goalDeadline ?? "");

  const submit = () => {
    updateMetricConfig(hobbyId, block.id, {
      unit: unit.trim(),
      direction,
      aggregation,
      goalValue: goalValue.trim() ? parseFloat(goalValue.replace(",", ".")) : undefined,
      goalDeadline: goalDeadline || undefined,
    });
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Impostazioni metrica</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Unità" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Es. km, pagine, ore, ripetizioni" />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Direzione dell'obiettivo</p>
            <div className="flex gap-2">
              <Chip label="Crescente (vuoi che salga)" selected={direction === "crescente"} onClick={() => setDirection("crescente")} />
              <Chip label="Decrescente (vuoi che scenda)" selected={direction === "decrescente"} onClick={() => setDirection("decrescente")} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Tipo di valore</p>
            <div className="flex gap-2">
              <Chip label="Cumulativo (si somma)" selected={aggregation === "cumulativa"} onClick={() => setAggregation("cumulativa")} />
              <Chip label="Puntuale (l'ultimo conta)" selected={aggregation === "puntuale"} onClick={() => setAggregation("puntuale")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Obiettivo" type="number" inputMode="decimal" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} />
            <TextField label="Entro il" type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit}>
            Salva
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
