import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { WorkoutPlan, WorkoutPlanTable, WorkoutPlanExercise, ExerciseLogEntry } from "@/lib/types";
import { todayIso } from "@/lib/date-format";

interface WorkoutPlansCtx {
  plans: WorkoutPlan[];
  addPlan: (name: string) => WorkoutPlan;
  removePlan: (planId: string) => void;
  addTable: (planId: string, name: string) => void;
  removeTable: (planId: string, tableId: string) => void;
  addExercise: (planId: string, tableId: string, input: Omit<WorkoutPlanExercise, "id">) => void;
  removeExercise: (planId: string, tableId: string, exerciseId: string) => void;
  addLogEntry: (planId: string, tableId: string, exerciseId: string, entry: Omit<ExerciseLogEntry, "id">) => void;
  removeLogEntry: (planId: string, tableId: string, exerciseId: string, entryId: string) => void;
}

function plansCtx(ctx: TiberExecutionContext): WorkoutPlansCtx {
  return ctxField<WorkoutPlansCtx>(ctx, "workoutPlans");
}

function findPlanByName(plans: WorkoutPlan[], name: string): WorkoutPlan | undefined {
  const needle = name.trim().toLowerCase();
  return (
    plans.find((p) => p.name.trim().toLowerCase() === needle) ??
    plans.find((p) => p.name.trim().toLowerCase().includes(needle))
  );
}

function findTableByName(plan: WorkoutPlan, name?: string): WorkoutPlanTable | undefined {
  if (plan.tables.length === 0) return undefined;
  if (!name) return plan.tables[0];
  const needle = name.trim().toLowerCase();
  return plan.tables.find((t) => t.name.trim().toLowerCase().includes(needle)) ?? plan.tables[0];
}

function findExerciseByName(table: WorkoutPlanTable, name: string): WorkoutPlanExercise | undefined {
  const needle = name.trim().toLowerCase();
  return table.exercises.find((e) => e.name.trim().toLowerCase().includes(needle));
}

export const workoutPlanTools: Record<string, TiberToolDefinition> = {
  crea_scheda_allenamento: {
    declaration: {
      name: "crea_scheda_allenamento",
      description: "Crea una nuova scheda allenamento (es. 'Scheda palestra inverno').",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome della scheda." } },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addPlan } = plansCtx(ctx);
      const created = addPlan(String(args.name));
      return `Scheda "${created.name}" creata.`;
    },
  },

  elimina_scheda_allenamento: {
    declaration: {
      name: "elimina_scheda_allenamento",
      description: "Elimina definitivamente una scheda allenamento, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) della scheda." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { plans, removePlan } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.name));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.name}".`;
      removePlan(plan.id);
      return `Scheda "${plan.name}" eliminata.`;
    },
  },

  aggiungi_tabella_scheda: {
    declaration: {
      name: "aggiungi_tabella_scheda",
      description: "Aggiunge una tabella (es. 'Push day', 'Gambe') a una scheda allenamento esistente.",
      parameters: {
        type: "OBJECT",
        properties: {
          planName: { type: "STRING", description: "Nome della scheda." },
          tableName: { type: "STRING", description: "Nome della nuova tabella." },
        },
        required: ["planName", "tableName"],
      },
    },
    execute: (args, ctx) => {
      const { plans, addTable } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.planName));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.planName}".`;
      addTable(plan.id, String(args.tableName));
      return `Tabella "${args.tableName}" aggiunta a "${plan.name}".`;
    },
  },

  elimina_tabella_scheda: {
    declaration: {
      name: "elimina_tabella_scheda",
      description: "Elimina una tabella da una scheda allenamento, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: {
          planName: { type: "STRING", description: "Nome della scheda." },
          tableName: { type: "STRING", description: "Nome (anche parziale) della tabella." },
        },
        required: ["planName", "tableName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { plans, removeTable } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.planName));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.planName}".`;
      const table = findTableByName(plan, String(args.tableName));
      if (!table) return `Non ho trovato nessuna tabella con nome simile a "${args.tableName}" in "${plan.name}".`;
      removeTable(plan.id, table.id);
      return `Tabella "${table.name}" eliminata.`;
    },
  },

  aggiungi_esercizio_scheda: {
    declaration: {
      name: "aggiungi_esercizio_scheda",
      description: "Aggiunge un esercizio a una tabella di una scheda allenamento.",
      parameters: {
        type: "OBJECT",
        properties: {
          planName: { type: "STRING", description: "Nome della scheda." },
          tableName: { type: "STRING", description: "Nome della tabella, se la scheda ne ha più di una." },
          exerciseName: { type: "STRING", description: "Nome dell'esercizio." },
          reps: { type: "STRING", description: "Serie e ripetizioni previste (es. '4x8')." },
        },
        required: ["planName", "exerciseName", "reps"],
      },
    },
    execute: (args, ctx) => {
      const { plans, addExercise } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.planName));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.planName}".`;
      const table = findTableByName(plan, args.tableName ? String(args.tableName) : undefined);
      if (!table) return `La scheda "${plan.name}" non ha nessuna tabella.`;
      addExercise(plan.id, table.id, { name: String(args.exerciseName), reps: String(args.reps) });
      return `Esercizio "${args.exerciseName}" aggiunto a "${table.name}".`;
    },
  },

  registra_serie_esercizio: {
    declaration: {
      name: "registra_serie_esercizio",
      description: "Registra una sessione svolta di un esercizio (peso, ripetizioni, serie), cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: {
          planName: { type: "STRING", description: "Nome della scheda." },
          exerciseName: { type: "STRING", description: "Nome (anche parziale) dell'esercizio." },
          weightKg: { type: "NUMBER", description: "Peso usato in kg." },
          reps: { type: "NUMBER", description: "Ripetizioni per serie." },
          sets: { type: "NUMBER", description: "Numero di serie." },
        },
        required: ["planName", "exerciseName", "weightKg", "reps", "sets"],
      },
    },
    execute: (args, ctx) => {
      const { plans, addLogEntry } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.planName));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.planName}".`;
      for (const table of plan.tables) {
        const exercise = findExerciseByName(table, String(args.exerciseName));
        if (exercise) {
          addLogEntry(plan.id, table.id, exercise.id, { date: todayIso(), weightKg: Number(args.weightKg), reps: Number(args.reps), sets: Number(args.sets) });
          return `Sessione di "${exercise.name}" registrata: ${args.weightKg}kg × ${args.reps} × ${args.sets} serie.`;
        }
      }
      return `Non ho trovato nessun esercizio con nome simile a "${args.exerciseName}" in "${plan.name}".`;
    },
  },

  elimina_esercizio_scheda: {
    declaration: {
      name: "elimina_esercizio_scheda",
      description: "Elimina un esercizio da una scheda allenamento, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: {
          planName: { type: "STRING", description: "Nome della scheda." },
          exerciseName: { type: "STRING", description: "Nome (anche parziale) dell'esercizio." },
        },
        required: ["planName", "exerciseName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { plans, removeExercise } = plansCtx(ctx);
      const plan = findPlanByName(plans, String(args.planName));
      if (!plan) return `Non ho trovato nessuna scheda con nome simile a "${args.planName}".`;
      for (const table of plan.tables) {
        const exercise = findExerciseByName(table, String(args.exerciseName));
        if (exercise) {
          removeExercise(plan.id, table.id, exercise.id);
          return `Esercizio "${exercise.name}" eliminato.`;
        }
      }
      return `Non ho trovato nessun esercizio con nome simile a "${args.exerciseName}" in "${plan.name}".`;
    },
  },

  elenca_schede_allenamento: {
    declaration: {
      name: "elenca_schede_allenamento",
      description: "Elenca le schede allenamento esistenti con le loro tabelle.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { plans } = plansCtx(ctx);
      if (plans.length === 0) return "Nessuna scheda allenamento creata.";
      return plans.map((p) => `${p.name} (${p.tables.map((t) => t.name).join(", ") || "nessuna tabella"})`).join("; ");
    },
  },
};
