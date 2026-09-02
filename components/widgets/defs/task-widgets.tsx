"use client";
import { useState } from "react";
import { CheckCircle2, ListTodo, AlertTriangle, Flame, ShoppingCart, Repeat, Plus } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { TASK_TYPE_LABEL } from "@/lib/types";
import { todayIso, formatDateShort } from "@/lib/date-format";
import { WidgetStat, WidgetList, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function NextTaskWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const today = todayIso();
  const next = [...tasks]
    .filter((t) => !t.completed && t.date >= today)
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))[0];

  if (!next) return <WidgetEmpty icon={ListTodo} label="Nessuna task in programma" />;
  return <WidgetStat icon={ListTodo} value={next.title} label={next.date === today ? "Oggi" : formatDateShort(next.date)} color={next.color} />;
}

export function TodayTasksWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const today = todayIso();
  const items = tasks
    .filter((t) => t.date === today && !t.completed)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
    .map((t) => ({ id: t.id, label: t.title, meta: t.time, color: t.color }));

  return <WidgetList title="Task di oggi" icon={ListTodo} items={items} emptyLabel="Niente in programma per oggi" />;
}

export function OverdueTasksWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const today = todayIso();
  const count = tasks.filter((t) => !t.completed && t.date < today).length;
  return <WidgetStat icon={AlertTriangle} value={count} label={count === 1 ? "Task scaduta" : "Task scadute"} color={count > 0 ? "#FF4D6D" : "#565B77"} />;
}

export function TaskStreakWidget({ size }: { size: WidgetSize }) {
  const { tasks, streakFor } = useTasks();
  const best = Math.max(0, ...tasks.filter((t) => t.type === "quotidiana").map(streakFor));
  return <WidgetStat icon={Flame} value={best} label={best === 1 ? "Giorno di fila" : "Giorni di fila"} color="#FFB454" />;
}

export function CompletedThisWeekWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoIso = weekAgo.toISOString().slice(0, 10);
  const count = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.slice(0, 10) >= weekAgoIso).length;
  return <WidgetStat icon={CheckCircle2} value={count} label="Completate questa settimana" color="#34D399" />;
}

export function TasksByTypeWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const today = todayIso();
  const active = tasks.filter((t) => !t.completed && t.date >= today);
  const counts = new Map<string, number>();
  active.forEach((t) => counts.set(t.type, (counts.get(t.type) ?? 0) + 1));
  const items = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ id: type, label: TASK_TYPE_LABEL[type as keyof typeof TASK_TYPE_LABEL] ?? type, meta: `${count}` }));
  return <WidgetList title="Task per categoria" icon={ListTodo} items={items} emptyLabel="Nessuna task in programma" />;
}

export function ShoppingListWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const active = tasks.filter((t) => t.type === "spesa" && !t.completed && t.shoppingList.length > 0);
  const list = active[0];
  if (!list) return <WidgetEmpty icon={ShoppingCart} label="Nessuna lista della spesa attiva" />;
  const done = list.shoppingList.filter((i) => i.done).length;
  const items = list.shoppingList
    .filter((i) => !i.done)
    .slice(0, 4)
    .map((i) => ({ id: i.id, label: i.label }));
  return <WidgetList title={`${list.title} · ${done}/${list.shoppingList.length}`} icon={ShoppingCart} items={items} emptyLabel="Lista completata!" />;
}

export function RecurringTodayWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const today = todayIso();
  const items = tasks
    .filter((t) => t.type === "quotidiana" && t.date === today && !t.completed)
    .map((t) => ({ id: t.id, label: t.title, color: t.color }));
  return <WidgetList title="Ricorrenti non ancora fatte" icon={Repeat} items={items} emptyLabel="Tutte fatte per oggi" />;
}

export function QuickAddTaskWidget({ size }: { size: WidgetSize }) {
  const { addTask } = useTasks();
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    addTask({
      title: text.trim(),
      type: "promemoria",
      date: todayIso(),
      reminderOffset: "none",
      recurrence: "nessuna",
      customDays: [],
      color: "#7C5CFF",
      priority: "media",
      tags: [],
      linkedPersonIds: [],
      subtasks: [],
      shoppingList: [],
    });
    setText("");
  };
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-1">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Nuova task..."
        className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-ink-100 placeholder:text-ink-800"
      />
      <button onClick={submit} disabled={!text.trim()} className="focus-ring flex items-center gap-1 text-[11px] text-aura-violet disabled:opacity-30">
        <Plus size={11} /> Aggiungi
      </button>
    </div>
  );
}
