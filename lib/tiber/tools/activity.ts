import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Workout, WeightEntry } from "@/lib/types";
import { ACTIVITIES, estimatedCalories } from "@/lib/activity-catalog";
import { todayIso } from "@/lib/date-format";
import { BodyMeasurement, WeeklyGoalType } from "@/lib/health-context";

interface ActivityCtx {
  workouts: Workout[];
  weightEntries: WeightEntry[];
  measurements: BodyMeasurement[];
  addWorkout: (input: Omit<Workout, "id" | "createdAt">) => void;
  removeWorkout: (id: string) => void;
  addWeightEntry: (value: number, date: string) => void;
  removeWeightEntry: (id: string) => void;
  setWeightGoal: (value: number | null) => void;
  setWeeklyGoal: (value: { type: WeeklyGoalType; target: number } | null) => void;
  addMeasurement: (m: Omit<BodyMeasurement, "id">) => void;
  removeMeasurement: (id: string) => void;
}

function activityCtx(ctx: TiberExecutionContext): ActivityCtx {
  return ctxField<ActivityCtx>(ctx, "activity");
}

const WEEKLY_GOAL_TYPES: WeeklyGoalType[] = ["minuti", "sessioni", "calorie"];

function findActivityByLabel(label: string): { id: string; label: string } | undefined {
  const needle = label.trim().toLowerCase();
  return (
    ACTIVITIES.find((a) => a.label.trim().toLowerCase() === needle) ??
    ACTIVITIES.find((a) => a.label.trim().toLowerCase().includes(needle))
  );
}

export const activityTools: Record<string, TiberToolDefinition> = {
  registra_allenamento: {
    declaration: {
      name: "registra_allenamento",
      description: "Registra una sessione di attività fisica svolta (es. corsa, palestra, nuoto), con durata in minuti.",
      parameters: {
        type: "OBJECT",
        properties: {
          activityName: { type: "STRING", description: "Nome dell'attività (es. 'Corsa', 'Pesi', 'Nuoto')." },
          minutes: { type: "NUMBER", description: "Durata in minuti." },
          distanceKm: { type: "NUMBER", description: "Distanza percorsa in km, se rilevante." },
          date: { type: "STRING", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["activityName", "minutes"],
      },
    },
    execute: (args, ctx) => {
      const { addWorkout } = activityCtx(ctx);
      const activity = findActivityByLabel(String(args.activityName));
      if (!activity) return `Non ho riconosciuto l'attività "${args.activityName}" nel catalogo di Vitae.`;
      const minutes = Number(args.minutes);
      const calories = estimatedCalories(activity.id, minutes);
      addWorkout({ activityId: activity.id, minutes, calories, distanceKm: args.distanceKm !== undefined ? Number(args.distanceKm) : undefined, date: args.date ? String(args.date) : todayIso() });
      return `Allenamento "${activity.label}" registrato: ${minutes} min, circa ${calories} kcal.`;
    },
  },

  elimina_allenamento: {
    declaration: {
      name: "elimina_allenamento",
      description: "Elimina l'allenamento più recente che corrisponde a un'attività indicata. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { activityName: { type: "STRING", description: "Nome (anche parziale) dell'attività." } },
        required: ["activityName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { workouts, removeWorkout } = activityCtx(ctx);
      const activity = findActivityByLabel(String(args.activityName));
      if (!activity) return `Non ho riconosciuto l'attività "${args.activityName}".`;
      const matches = workouts.filter((w) => w.activityId === activity.id).sort((a, b) => b.date.localeCompare(a.date));
      if (matches.length === 0) return `Nessun allenamento registrato per "${activity.label}".`;
      removeWorkout(matches[0].id);
      return `Allenamento "${activity.label}" del ${matches[0].date} eliminato.`;
    },
  },

  registra_peso: {
    declaration: {
      name: "registra_peso",
      description: "Registra una pesata dell'utente.",
      parameters: {
        type: "OBJECT",
        properties: {
          value: { type: "NUMBER", description: "Peso in kg." },
          date: { type: "STRING", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["value"],
      },
    },
    execute: (args, ctx) => {
      const { addWeightEntry } = activityCtx(ctx);
      const date = args.date ? String(args.date) : todayIso();
      addWeightEntry(Number(args.value), date);
      return `Peso di ${args.value} kg registrato per il ${date}.`;
    },
  },

  elimina_peso: {
    declaration: {
      name: "elimina_peso",
      description: "Rimuove l'ultima pesata registrata. Azione distruttiva.",
      parameters: { type: "OBJECT", properties: {} },
    },
    destructive: true,
    execute: (_args, ctx) => {
      const { weightEntries, removeWeightEntry } = activityCtx(ctx);
      const last = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return "Nessuna pesata registrata.";
      removeWeightEntry(last.id);
      return `Ultima pesata (${last.value} kg, ${last.date}) rimossa.`;
    },
  },

  imposta_obiettivo_peso: {
    declaration: {
      name: "imposta_obiettivo_peso",
      description: "Imposta o rimuove l'obiettivo di peso.",
      parameters: {
        type: "OBJECT",
        properties: { value: { type: "NUMBER", description: "Peso obiettivo in kg. Ometti per rimuoverlo." } },
      },
    },
    execute: (args, ctx) => {
      const { setWeightGoal } = activityCtx(ctx);
      if (args.value === undefined || args.value === null) {
        setWeightGoal(null);
        return "Obiettivo di peso rimosso.";
      }
      setWeightGoal(Number(args.value));
      return `Obiettivo di peso impostato a ${args.value} kg.`;
    },
  },

  imposta_obiettivo_settimanale_attivita: {
    declaration: {
      name: "imposta_obiettivo_settimanale_attivita",
      description: "Imposta l'obiettivo settimanale di attività fisica (minuti, sessioni o calorie).",
      parameters: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: WEEKLY_GOAL_TYPES, description: "Tipo di obiettivo." },
          target: { type: "NUMBER", description: "Valore obiettivo." },
        },
        required: ["type", "target"],
      },
    },
    execute: (args, ctx) => {
      const { setWeeklyGoal } = activityCtx(ctx);
      setWeeklyGoal({ type: args.type as WeeklyGoalType, target: Number(args.target) });
      return `Obiettivo settimanale impostato: ${args.target} ${args.type}.`;
    },
  },

  registra_misura_corporea: {
    declaration: {
      name: "registra_misura_corporea",
      description: "Registra una misura corporea (es. vita, petto, braccia).",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome della misura (es. 'Vita')." },
          value: { type: "NUMBER", description: "Valore misurato." },
          unit: { type: "STRING", description: "Unità di misura (es. 'cm')." },
        },
        required: ["name", "value", "unit"],
      },
    },
    execute: (args, ctx) => {
      const { addMeasurement } = activityCtx(ctx);
      addMeasurement({ name: String(args.name), value: Number(args.value), unit: String(args.unit), date: todayIso() });
      return `Misura "${args.name}" registrata: ${args.value}${args.unit}.`;
    },
  },

  elimina_misura_corporea: {
    declaration: {
      name: "elimina_misura_corporea",
      description: "Rimuove l'ultima misura corporea registrata per un dato nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) della misura." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { measurements, removeMeasurement } = activityCtx(ctx);
      const needle = String(args.name).trim().toLowerCase();
      const matches = measurements.filter((m) => m.name.trim().toLowerCase().includes(needle)).sort((a, b) => b.date.localeCompare(a.date));
      if (matches.length === 0) return `Nessuna misura simile a "${args.name}" registrata.`;
      removeMeasurement(matches[0].id);
      return `Misura "${matches[0].name}" rimossa.`;
    },
  },

  stato_attivita: {
    declaration: {
      name: "stato_attivita",
      description: "Restituisce l'ultimo peso registrato e il numero di allenamenti fatti negli ultimi 7 giorni.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { workouts, weightEntries } = activityCtx(ctx);
      const lastWeight = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const recentWorkouts = workouts.filter((w) => w.date >= weekAgo);
      return `Ultimo peso registrato: ${lastWeight ? `${lastWeight.value} kg (${lastWeight.date})` : "nessuno"}. Allenamenti negli ultimi 7 giorni: ${recentWorkouts.length}.`;
    },
  },
};
