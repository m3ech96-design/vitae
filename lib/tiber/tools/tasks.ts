import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Task, TaskType, Recurrence, Priority } from "@/lib/types";

interface TasksCtx {
  tasks: Task[];
  addTask: (input: Omit<Task, "id" | "createdAt" | "completed" | "completedAt" | "completionLog" | "spentAmount">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  toggleShoppingItem: (taskId: string, itemId: string) => void;
  completeTask: (id: string) => { streak: number; askSpent: boolean };
  uncompleteTask: (id: string) => void;
  setSpentAmount: (id: string, amount: number, chargedToBudget?: boolean) => void;
}

function tasksCtx(ctx: TiberExecutionContext): TasksCtx {
  return ctxField<TasksCtx>(ctx, "tasks");
}

function findTaskByTitle(tasks: Task[], title: string): Task | undefined {
  const needle = title.trim().toLowerCase();
  return (
    tasks.find((t) => t.title.trim().toLowerCase() === needle) ??
    tasks.find((t) => t.title.trim().toLowerCase().includes(needle))
  );
}

const TASK_TYPES: TaskType[] = ["quotidiana", "spesa", "appuntamento", "promemoria", "obiettivo", "evento"];
const RECURRENCES: Recurrence[] = ["nessuna", "quotidiano", "settimanale", "mensile", "annuale", "personalizzato"];
const PRIORITIES: Priority[] = ["nessuna", "bassa", "media", "alta", "urgente"];

export const taskTools: Record<string, TiberToolDefinition> = {
  crea_task: {
    declaration: {
      name: "crea_task",
      description:
        "Crea una nuova task (attività quotidiana, spesa, appuntamento, promemoria, obiettivo o evento) nella scheda Task di Vitae.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titolo della task." },
          type: { type: "string", enum: TASK_TYPES, description: "Tipo di task." },
          date: { type: "string", description: "Data in formato YYYY-MM-DD." },
          time: { type: "string", description: "Orario HH:MM, se rilevante (es. per Evento/Appuntamento)." },
          dueDate: { type: "string", description: "Data di scadenza YYYY-MM-DD, per Promemoria/Obiettivo/Spesa." },
          notes: { type: "string", description: "Note libere sulla task." },
          recurrence: { type: "string", enum: RECURRENCES, description: "Ricorrenza della task." },
          priority: { type: "string", enum: PRIORITIES, description: "Priorità della task." },
        },
        required: ["title", "type", "date"],
      },
    },
    execute: (args, ctx) => {
      const { addTask } = tasksCtx(ctx);
      const created = addTask({
        title: String(args.title),
        type: (args.type as TaskType) ?? "promemoria",
        date: String(args.date),
        time: args.time ? String(args.time) : undefined,
        dueDate: args.dueDate ? String(args.dueDate) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
        reminderOffset: "none",
        recurrence: (args.recurrence as Recurrence) ?? "nessuna",
        customDays: [],
        color: "#7C5CFF",
        priority: (args.priority as Priority) ?? "nessuna",
        tags: [],
        linkedPersonIds: [],
        subtasks: [],
        shoppingList: [],
      });
      return `Task "${created.title}" creata per il ${created.date}.`;
    },
  },

  completa_task: {
    declaration: {
      name: "completa_task",
      description: "Segna come completata una task esistente, cercandola per titolo.",
      parameters: {
        type: "object",
        properties: { title: { type: "string", description: "Titolo (anche parziale) della task da completare." } },
        required: ["title"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, completeTask } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.title));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.title}".`;
      completeTask(task.id);
      return `Task "${task.title}" segnata come completata.`;
    },
  },

  riapri_task: {
    declaration: {
      name: "riapri_task",
      description: "Riporta una task completata allo stato non completato, cercandola per titolo.",
      parameters: {
        type: "object",
        properties: { title: { type: "string", description: "Titolo (anche parziale) della task da riaprire." } },
        required: ["title"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, uncompleteTask } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.title));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.title}".`;
      uncompleteTask(task.id);
      return `Task "${task.title}" riaperta.`;
    },
  },

  modifica_task: {
    declaration: {
      name: "modifica_task",
      description: "Modifica campi di una task esistente (titolo, data, note, priorità...), cercandola per titolo.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titolo (anche parziale) della task da modificare." },
          newTitle: { type: "string", description: "Nuovo titolo, se da cambiare." },
          date: { type: "string", description: "Nuova data YYYY-MM-DD." },
          dueDate: { type: "string", description: "Nuova scadenza YYYY-MM-DD." },
          notes: { type: "string", description: "Nuove note." },
          priority: { type: "string", enum: PRIORITIES, description: "Nuova priorità." },
        },
        required: ["title"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, updateTask } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.title));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.title}".`;
      const patch: Partial<Task> = {};
      if (args.newTitle) patch.title = String(args.newTitle);
      if (args.date) patch.date = String(args.date);
      if (args.dueDate) patch.dueDate = String(args.dueDate);
      if (args.notes) patch.notes = String(args.notes);
      if (args.priority) patch.priority = args.priority as Priority;
      updateTask(task.id, patch);
      return `Task "${task.title}" aggiornata.`;
    },
  },

  registra_spesa_task: {
    declaration: {
      name: "registra_spesa_task",
      description: "Registra quanto è costata una task di tipo Spesa, cercandola per titolo.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titolo (anche parziale) della task di tipo Spesa." },
          amount: { type: "number", description: "Importo speso in euro." },
        },
        required: ["title", "amount"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, setSpentAmount } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.title));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.title}".`;
      setSpentAmount(task.id, Number(args.amount));
      return `Registrata una spesa di ${Number(args.amount).toLocaleString("it-IT")}€ per la task "${task.title}".`;
    },
  },

  spunta_sottotask: {
    declaration: {
      name: "spunta_sottotask",
      description: "Spunta (o toglie la spunta) a una sottotask, cercando la task per titolo e la sottotask per testo.",
      parameters: {
        type: "object",
        properties: {
          taskTitle: { type: "string", description: "Titolo (anche parziale) della task principale." },
          subtaskTitle: { type: "string", description: "Testo (anche parziale) della sottotask." },
        },
        required: ["taskTitle", "subtaskTitle"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, toggleSubtask } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.taskTitle));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.taskTitle}".`;
      const needle = String(args.subtaskTitle).trim().toLowerCase();
      const sub = task.subtasks.find((s) => s.title.trim().toLowerCase().includes(needle));
      if (!sub) return `Non ho trovato nessuna sottotask simile a "${args.subtaskTitle}" in "${task.title}".`;
      toggleSubtask(task.id, sub.id);
      return `Sottotask "${sub.title}" ${sub.done ? "riaperta" : "completata"}.`;
    },
  },

  spunta_voce_spesa_task: {
    declaration: {
      name: "spunta_voce_spesa_task",
      description: "Spunta (o toglie la spunta) a una voce della lista della spesa dentro una task di tipo Spesa.",
      parameters: {
        type: "object",
        properties: {
          taskTitle: { type: "string", description: "Titolo (anche parziale) della task di tipo Spesa." },
          itemLabel: { type: "string", description: "Testo (anche parziale) della voce." },
        },
        required: ["taskTitle", "itemLabel"],
      },
    },
    execute: (args, ctx) => {
      const { tasks, toggleShoppingItem } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.taskTitle));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.taskTitle}".`;
      const needle = String(args.itemLabel).trim().toLowerCase();
      const item = task.shoppingList.find((i) => i.label.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessuna voce simile a "${args.itemLabel}" in "${task.title}".`;
      toggleShoppingItem(task.id, item.id);
      return `Voce "${item.label}" ${item.done ? "riaperta" : "spuntata"}.`;
    },
  },

  elimina_task: {
    declaration: {
      name: "elimina_task",
      description: "Elimina definitivamente una task, cercandola per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { title: { type: "string", description: "Titolo (anche parziale) della task da eliminare." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { tasks, removeTask } = tasksCtx(ctx);
      const task = findTaskByTitle(tasks, String(args.title));
      if (!task) return `Non ho trovato nessuna task con titolo simile a "${args.title}".`;
      removeTask(task.id);
      return `Task "${task.title}" eliminata.`;
    },
  },

  elenca_task: {
    declaration: {
      name: "elenca_task",
      description: "Restituisce l'elenco delle task non completate, con titolo, tipo e data — usalo per rispondere a domande sulle task esistenti.",
      parameters: { type: "object", properties: {} },
    },
    execute: (_args, ctx) => {
      const { tasks } = tasksCtx(ctx);
      const open = tasks.filter((t) => !t.completed);
      if (open.length === 0) return "Nessuna task aperta al momento.";
      return open.map((t) => `${t.title} (${t.type}, ${t.date}${t.dueDate ? `, scade ${t.dueDate}` : ""})`).join("; ");
    },
  },
};
