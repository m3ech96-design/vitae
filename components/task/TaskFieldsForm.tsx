"use client";
import {
  TaskType,
  TASK_TYPE_LABEL,
  Recurrence,
  RECURRENCE_LABEL,
  Priority,
  PRIORITY_LABEL,
  PRIORITY_TINT,
  SubTask,
  ShoppingItem,
  Weekday,
  WEEKDAY_LABEL,
  ReminderOffset,
  REMINDER_OFFSET_LABEL,
  taskGroup,
} from "@/lib/types";
import { TASK_COLORS } from "@/lib/task-colors";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { TextField, TextArea } from "../ui/TextField";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";
import { TagListField } from "../wizard/TagListField";
import { SubtaskEditor } from "./SubtaskEditor";
import { ShoppingListEditor } from "./ShoppingListEditor";

const TASK_TYPES: TaskType[] = ["evento", "appuntamento", "promemoria", "obiettivo", "quotidiana", "spesa"];
const RECURRENCES: Recurrence[] = ["nessuna", "quotidiano", "settimanale", "mensile", "annuale", "personalizzato"];
const PRIORITIES: Priority[] = ["nessuna", "bassa", "media", "alta", "urgente"];
const WEEKDAYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const REMINDER_OFFSETS: ReminderOffset[] = ["none", "5min", "10min", "30min", "1h", "2h", "1day", "1week"];

export interface TaskDraftFields {
  title: string;
  notes: string;
  type: TaskType;
  date: string;
  time: string;
  endTime: string;
  dueDate: string;
  dueTime: string;
  reminderOffset: ReminderOffset;
  recurrence: Recurrence;
  customDays: Weekday[];
  color: string;
  priority: Priority;
  tags: string[];
  linkedPersonIds: string[];
  linkedPlaceId: string;
  subtasks: SubTask[];
  shoppingList: ShoppingItem[];
}

/**
 * Tutti i campi di creazione di una Task, in un unico componente condiviso — così la
 * creazione di un Impegno può essere davvero identica, non un sottoinsieme che finge di esserlo.
 * I campi di orario si adattano al tipo: Evento/Appuntamento hanno inizio+fine (non si
 * spuntano, si completano da soli); Promemoria/Obiettivo/Spesa hanno inizio+scadenza (si
 * spuntano a mano); Attività Quotidiana non ha orari, solo la spunta giornaliera.
 */
export function TaskFieldsForm({
  value,
  onChange,
  colorLabel = "Colore Task",
  peopleLabel = "Persone Coinvolte",
  excludePersonId,
  fixedType,
}: {
  value: TaskDraftFields;
  onChange: (patch: Partial<TaskDraftFields>) => void;
  colorLabel?: string;
  peopleLabel?: string;
  /** Nella scheda di una persona, quella persona non compare tra le "persone coinvolte" di se stessa. */
  excludePersonId?: string;
  /** Per gli Impegni: il tipo è sempre Evento, niente selettore. */
  fixedType?: boolean;
}) {
  const { people } = useHousehold();
  const { places } = usePlaces();
  const selectablePeople = people.filter((p) => p.id !== excludePersonId);

  const effectiveRecurrence: Recurrence = value.type === "quotidiana" ? "quotidiano" : value.recurrence;
  const group = taskGroup(value.type);

  const toggleDay = (d: Weekday) => {
    onChange({
      customDays: value.customDays.includes(d) ? value.customDays.filter((x) => x !== d) : [...value.customDays, d],
    });
  };

  return (
    <>
      <TextField label="Titolo" value={value.title} onChange={(e) => onChange({ title: e.target.value })} autoFocus />
      <TextArea label="Note" value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} />

      {!fixedType && (
        <div>
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Tipo</span>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onChange({ type: t })}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition-all ${
                  value.type === t
                    ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                    : "border-white/10 text-ink-600 hover:text-ink-200"
                }`}
              >
                {TASK_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {group === "tempo" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Data" type="date" value={value.date} onChange={(e) => onChange({ date: e.target.value })} />
            <TextField label="Ora inizio" type="time" value={value.time} onChange={(e) => onChange({ time: e.target.value })} />
            <TextField label="Ora fine" type="time" value={value.endTime} onChange={(e) => onChange({ endTime: e.target.value })} />
          </div>
          <p className="-mt-3 text-[11px] text-ink-800">
            Non si spunta a mano: si completa da sola quando l&apos;ora di fine arriva.
          </p>
        </>
      )}

      {group === "scadenza" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data inizio" type="date" value={value.date} onChange={(e) => onChange({ date: e.target.value })} />
            <TextField label="Ora inizio" type="time" value={value.time} onChange={(e) => onChange({ time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data scadenza" type="date" value={value.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} />
            <TextField label="Ora scadenza" type="time" value={value.dueTime} onChange={(e) => onChange({ dueTime: e.target.value })} />
          </div>
        </>
      )}

      {group !== "quotidiana" && (
        <label className="block">
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            Avviso anticipato
          </span>
          <select
            value={value.reminderOffset}
            onChange={(e) => onChange({ reminderOffset: e.target.value as ReminderOffset })}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
          >
            {REMINDER_OFFSETS.map((r) => (
              <option key={r} value={r} className="bg-void-800">
                {REMINDER_OFFSET_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      )}

      {!fixedType && (
        <div>
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            Ricorrenza {value.type === "quotidiana" && "· Fissa Su Ogni Giorno"}
          </span>
          <select
            value={effectiveRecurrence}
            onChange={(e) => onChange({ recurrence: e.target.value as Recurrence })}
            disabled={value.type === "quotidiana"}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 disabled:opacity-50"
          >
            {RECURRENCES.map((r) => (
              <option key={r} value={r} className="bg-void-800">
                {RECURRENCE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
      )}

      {!fixedType && effectiveRecurrence === "personalizzato" && (
        <div>
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            In quali giorni
          </span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`focus-ring rounded-full border px-3.5 py-2 text-xs transition-all ${
                  value.customDays.includes(d)
                    ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100"
                    : "border-white/10 text-ink-600"
                }`}
              >
                {WEEKDAY_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{colorLabel}</span>
        <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
          {TASK_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className="h-7 w-7 shrink-0 rounded-full border-2 transition-transform active:scale-90"
              style={{
                background: c,
                borderColor: value.color === c ? "#fff" : "transparent",
                boxShadow: value.color === c ? `0 0 10px ${c}` : "none",
              }}
              aria-label={`Colore ${c}`}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Priorità</span>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => {
            const tint = PRIORITY_TINT[p];
            return (
              <button
                key={p}
                onClick={() => onChange({ priority: p })}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  value.priority === p ? "border-white/30 text-ink-100" : "border-white/10 text-ink-600"
                }`}
                style={value.priority === p && tint ? { background: `${tint}22` } : undefined}
              >
                {tint && <span className="h-2 w-2 rounded-full" style={{ background: tint }} />}
                {PRIORITY_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      <TagListField label="Tag" tags={value.tags} onChange={(tags) => onChange({ tags })} placeholder="Aggiungi..." />

      <MultiPersonPicker
        label={peopleLabel}
        values={value.linkedPersonIds}
        options={selectablePeople}
        onChange={(linkedPersonIds) => onChange({ linkedPersonIds })}
      />

      <label className="block">
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Luogo collegato</span>
        <select
          value={value.linkedPlaceId}
          onChange={(e) => onChange({ linkedPlaceId: e.target.value })}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
        >
          <option value="" className="bg-void-800">
            Nessuno
          </option>
          {places.map((p) => (
            <option key={p.id} value={p.id} className="bg-void-800">
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <SubtaskEditor subtasks={value.subtasks} onChange={(subtasks) => onChange({ subtasks })} />
      {value.type === "spesa" && (
        <ShoppingListEditor items={value.shoppingList} onChange={(shoppingList) => onChange({ shoppingList })} />
      )}
    </>
  );
}
