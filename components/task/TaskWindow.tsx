"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Trash2, Tag as TagIcon, Pencil, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Task,
  TASK_TYPE_LABEL,
  RECURRENCE_LABEL,
  PRIORITY_LABEL,
  PRIORITY_TINT,
  taskGroup,
} from "@/lib/types";
import { formatDateTime } from "@/lib/date-format";
import { taskCategory } from "@/lib/task-status";
import { useTasks } from "@/lib/tasks-context";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { AuraAvatar } from "../ui/AuraAvatar";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { NewTaskModal } from "./NewTaskModal";

export function TaskWindow({ task, onClose }: { task: Task; onClose: () => void }) {
  const { toggleSubtask, toggleShoppingItem, removeTask, tasks } = useTasks();
  const { people } = useHousehold();
  const { places } = usePlaces();
  const place = task.linkedPlaceId ? places.find((p) => p.id === task.linkedPlaceId) : undefined;
  const tint = PRIORITY_TINT[task.priority];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const group = taskGroup(task.type);
  const category = taskCategory(task);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (editing) {
    return <NewTaskModal task={task} onClose={() => setEditing(false)} />;
  }
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-start justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: task.color }} />
            <span className="text-xs uppercase tracking-wide text-ink-600">{TASK_TYPE_LABEL[task.type]}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(true)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Modifica">
              <Pencil size={16} />
            </button>
            <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <h2 className="font-display text-xl text-ink-100">{task.title}</h2>
            {task.notes && <p className="mt-1.5 text-sm text-ink-600">{task.notes}</p>}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 px-3 py-1 text-ink-400">
              {group === "tempo"
                ? `${formatDateTime(task.date, task.time)}${task.endTime ? ` – ${task.endTime}` : ""}`
                : group === "scadenza" && task.dueDate
                ? `Scade ${formatDateTime(task.dueDate, task.dueTime)}`
                : formatDateTime(task.date, task.time)}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-ink-400">
              {RECURRENCE_LABEL[task.recurrence]}
            </span>
            {category === "non-completate" && (
              <span className="flex items-center gap-1 rounded-full border border-aura-pink/40 px-3 py-1 text-aura-pink">
                <AlertTriangle size={11} /> Non completata
              </span>
            )}
            {tint && (
              <span
                className="rounded-full border px-3 py-1"
                style={{ borderColor: `${tint}55`, color: tint }}
              >
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
            {task.spentAmount !== undefined && (
              <span className="rounded-full border border-aura-emerald/40 px-3 py-1 text-aura-emerald">
                {task.spentAmount.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
              </span>
            )}
          </div>

          {place && (
            <p className="flex items-center gap-1.5 text-sm text-ink-400">
              <MapPin size={14} /> {place.name}
            </p>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink-400">
                  <TagIcon size={10} /> {t}
                </span>
              ))}
            </div>
          )}

          {task.linkedPersonIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.linkedPersonIds.map((id) => {
                const p = people.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex flex-col items-center gap-1">
                    <AuraAvatar
                      imageUrl={p.avatarUrl}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      size={40}
                      ring="idle"
                      glowColor={personColor(p.id)}
                      glowIntensity={auraIntensity(p, tasks, places)}
                      deceased={p.deceased}
                    />
                    <span className="text-[10px] text-ink-600">{p.firstName}</span>
                  </div>
                );
              })}
            </div>
          )}

          {task.subtasks.length > 0 && (
            <div>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Sub-Task</p>
              <div className="space-y-2">
                {task.subtasks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubtask(task.id, s.id)}
                    className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        s.done ? "border-aura-cyan bg-aura-cyan/20" : "border-white/20"
                      }`}
                    >
                      {s.done && <span className="h-2 w-2 rounded-full bg-aura-cyan" />}
                    </span>
                    <span className={`text-sm ${s.done ? "text-ink-800 line-through" : "text-ink-100"}`}>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {task.type === "spesa" && task.shoppingList.length > 0 && (
            <div>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Lista della spesa</p>
              <div className="space-y-2">
                {task.shoppingList.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggleShoppingItem(task.id, it.id)}
                    className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        it.done ? "border-aura-emerald bg-aura-emerald/20" : "border-white/20"
                      }`}
                    >
                      {it.done && <span className="h-2 w-2 rounded-full bg-aura-emerald" />}
                    </span>
                    <span className={`text-sm ${it.done ? "text-ink-800 line-through" : "text-ink-100"}`}>{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="danger"
            size="sm"
            className="w-full justify-center"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={13} /> Elimina task
          </Button>
        </div>
      </motion.div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa task?"
          description="Non potrai più recuperarla, con tutte le sue sub-task."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeTask(task.id);
            onClose();
          }}
        />
      )}
    </div>,
    document.body
  );
}
