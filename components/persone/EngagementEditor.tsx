"use client";
import { useMemo, useState } from "react";
import { MapPin, Bell, Trash2, CalendarDays, ListChecks, Clock } from "lucide-react";
import { Engagement, Recurrence, REMINDER_OFFSET_LABEL } from "@/lib/types";
import { capitalizeSentence } from "@/lib/text";
import { formatDateTime, todayIso } from "@/lib/date-format";
import { taskOccursOnDate } from "@/lib/recurrence";
import { usePlaces } from "@/lib/places-context";
import { TaskFieldsForm, TaskDraftFields } from "../task/TaskFieldsForm";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { DayStrip } from "../task/DayStrip";

const EMPTY_DRAFT: TaskDraftFields = {
  title: "",
  notes: "",
  type: "evento",
  date: todayIso(),
  time: "",
  endTime: "",
  dueDate: "",
  dueTime: "",
  reminderOffset: "none",
  recurrence: "nessuna",
  customDays: [],
  color: "#7C5CFF",
  priority: "nessuna",
  tags: [],
  linkedPersonIds: [],
  linkedPlaceId: "",
  subtasks: [],
  shoppingList: [],
};

export function EngagementEditor({
  personId,
  engagements,
  onChange,
}: {
  personId: string;
  engagements: Engagement[];
  onChange: (engagements: Engagement[]) => void;
}) {
  const { places } = usePlaces();
  const [draft, setDraft] = useState<TaskDraftFields>(EMPTY_DRAFT);
  const [view, setView] = useState<"elenco" | "calendario">("elenco");
  const [selectedDay, setSelectedDay] = useState(todayIso());

  const patch = (p: Partial<TaskDraftFields>) => setDraft((d) => ({ ...d, ...p }));

  const upcoming = [...engagements].sort((a, b) => `${a.date}T${a.time || "23:59"}`.localeCompare(`${b.date}T${b.time || "23:59"}`));

  const calendarEngagements = useMemo(
    () => [...engagements].filter((e) => taskOccursOnDate(e, selectedDay)).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [engagements, selectedDay]
  );

  const reset = () => setDraft(EMPTY_DRAFT);

  const submit = () => {
    if (!draft.title.trim() || !draft.date) return;
    const effectiveRecurrence: Recurrence = draft.recurrence;
    const engagement: Engagement = {
      id: Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4),
      title: capitalizeSentence(draft.title.trim()),
      notes: draft.notes.trim() ? capitalizeSentence(draft.notes.trim()) : undefined,
      type: "evento",
      date: draft.date,
      time: draft.time || undefined,
      endTime: draft.endTime || undefined,
      reminderOffset: draft.reminderOffset,
      recurrence: effectiveRecurrence,
      customDays: draft.customDays,
      color: draft.color,
      priority: draft.priority,
      tags: draft.tags,
      linkedPersonIds: draft.linkedPersonIds,
      linkedPlaceId: draft.linkedPlaceId || undefined,
      subtasks: draft.subtasks,
      shoppingList: [],
      completed: false,
      completionLog: [],
      createdAt: new Date().toISOString(),
    };
    onChange([...engagements, engagement]);
    reset();
  };

  const renderCard = (e: Engagement) => {
    const place = e.linkedPlaceId ? places.find((p) => p.id === e.linkedPlaceId) : undefined;
    return (
      <div key={e.id} className="flex items-start gap-3 rounded-xl2 border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-100">{e.title}</p>
          <p className="flex items-center gap-1 text-[11px] text-ink-600">
            <Clock size={10} />
            {formatDateTime(e.date, e.time)}
            {e.endTime ? ` – ${e.endTime}` : ""}
          </p>
          {place && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-800">
              <MapPin size={10} /> {place.name}
            </p>
          )}
          {e.reminderOffset !== "none" && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-aura-cyan">
              <Bell size={9} /> {REMINDER_OFFSET_LABEL[e.reminderOffset]}
            </p>
          )}
        </div>
        <button
          onClick={() => onChange(engagements.filter((x) => x.id !== e.id))}
          className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink"
          aria-label="Rimuovi"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setView("elenco")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            view === "elenco" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ListChecks size={13} /> Elenco
        </button>
        <button
          onClick={() => setView("calendario")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            view === "calendario" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <CalendarDays size={13} /> Calendario
        </button>
      </div>

      {view === "elenco" ? (
        <div className="space-y-3">
          {upcoming.length === 0 && <p className="text-sm text-ink-800">Nessun Impegno In Programma.</p>}
          {upcoming.map(renderCard)}
        </div>
      ) : (
        <div>
          <DayStrip selected={selectedDay} onSelect={setSelectedDay} hasTasks={(iso) => engagements.some((e) => taskOccursOnDate(e, iso))} />
          <div className="mt-4 space-y-2.5">
            {calendarEngagements.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-800">Nessun Impegno In Questo Giorno.</p>
            )}
            {calendarEngagements.map(renderCard)}
          </div>
        </div>
      )}

      <InlineAddPanel label="Aggiungi Impegno" canConfirm={Boolean(draft.title.trim() && draft.date)} onConfirm={submit} onOpenChange={(o) => !o && reset()}>
        <p className="-mt-1 text-[11px] text-ink-800">
          Identico A Una Task Di Tipo Evento: Ha Sempre Un Inizio E Una Fine, Non Si Spunta A Mano.
        </p>
        <TaskFieldsForm
          value={draft}
          onChange={patch}
          colorLabel="Colore Impegno"
          peopleLabel="Altre Persone Coinvolte"
          excludePersonId={personId}
          fixedType
        />
      </InlineAddPanel>
    </div>
  );
}
