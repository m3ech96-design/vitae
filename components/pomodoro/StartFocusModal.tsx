"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ListChecks, Gauge, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { usePomodoro } from "@/lib/pomodoro-context";
import { useTasks } from "@/lib/tasks-context";
import { useHobby } from "@/lib/hobby-context";
import { FocusLinkKind } from "@/lib/pomodoro-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";

/**
 * Tre modi di avviare una sessione, sullo stesso piano — nessun default implicito
 * dell'uno sull'altro (stesso principio già seguito per `linkedTo` in Wishlist):
 * - "task": la sessione conta per quella Task (utile solo a mostrarla nello storico
 *   raggruppata per Task — la Task stessa non si completa da sola a fine sessione).
 * - "metrica": ogni ciclo di lavoro completato diventa una voce nel blocco Metrica scelto.
 * - "libera": nessun collegamento, solo un'etichetta facoltativa.
 */
export function StartFocusModal({ onClose }: { onClose: () => void }) {
  const { startRun } = usePomodoro();
  const { tasks } = useTasks();
  const { hobbies } = useHobby();

  const [kind, setKind] = useState<FocusLinkKind>("libera");
  const [taskId, setTaskId] = useState("");
  const [hobbyId, setHobbyId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [label, setLabel] = useState("");

  const openTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const metricBlocksByHobby = useMemo(
    () => hobbies.map((h) => ({ hobby: h, blocks: h.blocks.filter((b) => b.kind === "metrica") })).filter((x) => x.blocks.length > 0),
    [hobbies]
  );

  const canStart = kind === "libera" ? true : kind === "task" ? Boolean(taskId) : Boolean(hobbyId && blockId);

  const submit = () => {
    if (!canStart) return;
    if (kind === "task") startRun({ kind: "task", taskId }, label.trim() || undefined);
    else if (kind === "metrica") startRun({ kind: "metrica", hobbyId, blockId }, label.trim() || undefined);
    else startRun({ kind: "libera" }, label.trim() || undefined);
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
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Nuova sessione</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex gap-2">
            <Chip label="Libera" icon={Sparkles} selected={kind === "libera"} onClick={() => setKind("libera")} />
            <Chip label="Task" icon={ListChecks} selected={kind === "task"} onClick={() => setKind("task")} />
            <Chip label="Metrica" icon={Gauge} selected={kind === "metrica"} onClick={() => setKind("metrica")} />
          </div>

          {kind === "task" && (
            <label className="block">
              <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Task</span>
              <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100">
                <option value="" className="bg-void-800">Scegli una task</option>
                {openTasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-void-800">{t.title}</option>
                ))}
              </select>
              {openTasks.length === 0 && <p className="mt-1.5 text-[11px] text-ink-800">Nessuna task aperta al momento.</p>}
            </label>
          )}

          {kind === "metrica" && (
            <label className="block">
              <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Blocco metrica</span>
              <select
                value={blockId ? `${hobbyId}::${blockId}` : ""}
                onChange={(e) => {
                  const [h, b] = e.target.value.split("::");
                  setHobbyId(h ?? "");
                  setBlockId(b ?? "");
                }}
                className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
              >
                <option value="" className="bg-void-800">Scegli un blocco</option>
                {metricBlocksByHobby.map(({ hobby, blocks }) => (
                  <optgroup key={hobby.id} label={hobby.name}>
                    {blocks.map((b) => (
                      <option key={b.id} value={`${hobby.id}::${b.id}`} className="bg-void-800">{b.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {metricBlocksByHobby.length === 0 && (
                <p className="mt-1.5 text-[11px] text-ink-800">Nessun hobby ha ancora un blocco Metrica.</p>
              )}
            </label>
          )}

          <TextField label="Etichetta (facoltativa)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Es. Lettura, Studio inglese..." />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canStart}>
            Avvia
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
