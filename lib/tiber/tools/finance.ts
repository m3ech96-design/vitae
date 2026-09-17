import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { SingleExpense, SavingsGoal, SavingsEntry, ExpenseCategory, RecurringExpense, PlannedExpense, ExpenseRecurrence } from "@/lib/types";
import { SalarySplit } from "@/lib/finance-context";

interface FinanceCtx {
  monthlyBudget: number | null;
  setMonthlyBudget: (v: number | null) => void;
  cycleStartDay: number;
  setCycleStartDay: (day: number) => void;
  salarySplit: SalarySplit;
  setSalarySplit: (split: SalarySplit) => void;
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (label: string, amount: number, category: ExpenseCategory, recurrence: ExpenseRecurrence) => void;
  toggleRecurringExpense: (id: string) => void;
  removeRecurringExpense: (id: string) => void;
  plannedExpenses: PlannedExpense[];
  addPlannedExpense: (label: string, amount: number, dueDate: string, category: ExpenseCategory) => void;
  markPlannedPaid: (id: string) => void;
  removePlannedExpense: (id: string) => void;
  singleExpenses: SingleExpense[];
  addSingleExpense: (label: string, amount: number, date: string, category: ExpenseCategory, chargedToBudget?: boolean) => void;
  removeSingleExpense: (id: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (label: string, targetAmount: number) => void;
  contributeSavingsGoal: (id: string, amount: number) => void;
  removeSavingsGoal: (id: string) => void;
  savingsEntries: SavingsEntry[];
  addSavingsEntry: (amount: number, note?: string) => void;
}

function financeCtx(ctx: TiberExecutionContext): FinanceCtx {
  return ctxField<FinanceCtx>(ctx, "finance");
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "casa",
  "cibo",
  "trasporti",
  "salute",
  "svago",
  "abbonamenti",
  "shopping",
  "bollette",
  "servizi",
  "altro",
];
const EXPENSE_RECURRENCES: ExpenseRecurrence[] = ["settimanale", "mensile", "annuale"];

function findGoalByLabel(goals: SavingsGoal[], label: string): SavingsGoal | undefined {
  const needle = label.trim().toLowerCase();
  return (
    goals.find((g) => g.label.trim().toLowerCase() === needle) ??
    goals.find((g) => g.label.trim().toLowerCase().includes(needle))
  );
}

function findRecurringByLabel(items: RecurringExpense[], label: string): RecurringExpense | undefined {
  const needle = label.trim().toLowerCase();
  return items.find((e) => e.label.trim().toLowerCase().includes(needle));
}

function findPlannedByLabel(items: PlannedExpense[], label: string): PlannedExpense | undefined {
  const needle = label.trim().toLowerCase();
  return items.find((e) => e.label.trim().toLowerCase().includes(needle));
}

export const financeTools: Record<string, TiberToolDefinition> = {
  aggiungi_spesa: {
    declaration: {
      name: "aggiungi_spesa",
      description: "Registra una spesa singola in Finanze, con categoria e data.",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Descrizione della spesa (es. 'Spesa al discount')." },
          amount: { type: "NUMBER", description: "Importo in euro." },
          date: { type: "STRING", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
          category: { type: "STRING", enum: EXPENSE_CATEGORIES, description: "Categoria della spesa." },
        },
        required: ["label", "amount"],
      },
    },
    execute: (args, ctx) => {
      const { addSingleExpense } = financeCtx(ctx);
      const date = args.date ? String(args.date) : new Date().toISOString().slice(0, 10);
      const category = (args.category as ExpenseCategory) ?? "altro";
      addSingleExpense(String(args.label), Number(args.amount), date, category);
      return `Spesa "${args.label}" di ${Number(args.amount).toLocaleString("it-IT")}€ registrata in categoria ${category}.`;
    },
  },

  elimina_spesa: {
    declaration: {
      name: "elimina_spesa",
      description: "Elimina una spesa singola registrata, cercandola per descrizione. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Descrizione (anche parziale) della spesa da eliminare." } },
        required: ["label"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { singleExpenses, removeSingleExpense } = financeCtx(ctx);
      const needle = String(args.label).trim().toLowerCase();
      const found = singleExpenses.find((e) => e.label.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessuna spesa con descrizione simile a "${args.label}".`;
      removeSingleExpense(found.id);
      return `Spesa "${found.label}" eliminata.`;
    },
  },

  imposta_budget_mensile: {
    declaration: {
      name: "imposta_budget_mensile",
      description: "Imposta o rimuove il budget mensile del ciclo di spesa corrente.",
      parameters: {
        type: "OBJECT",
        properties: { amount: { type: "NUMBER", description: "Nuovo budget in euro. Ometti per rimuoverlo." } },
      },
    },
    execute: (args, ctx) => {
      const { setMonthlyBudget } = financeCtx(ctx);
      if (args.amount === undefined || args.amount === null) {
        setMonthlyBudget(null);
        return "Budget mensile rimosso.";
      }
      setMonthlyBudget(Number(args.amount));
      return `Budget mensile impostato a ${Number(args.amount).toLocaleString("it-IT")}€.`;
    },
  },

  imposta_inizio_ciclo_budget: {
    declaration: {
      name: "imposta_inizio_ciclo_budget",
      description: "Imposta il giorno del mese (1-28) in cui inizia il ciclo di budget.",
      parameters: {
        type: "OBJECT",
        properties: { day: { type: "NUMBER", description: "Giorno del mese, da 1 a 28." } },
        required: ["day"],
      },
    },
    execute: (args, ctx) => {
      const { setCycleStartDay } = financeCtx(ctx);
      setCycleStartDay(Number(args.day));
      return `Inizio del ciclo di budget impostato al giorno ${args.day} del mese.`;
    },
  },

  imposta_ripartizione_stipendio: {
    declaration: {
      name: "imposta_ripartizione_stipendio",
      description: "Imposta le tre percentuali (spese fisse, tempo libero, risparmi) del calcolatore stipendio — devono sommare a 100.",
      parameters: {
        type: "OBJECT",
        properties: {
          speseFisse: { type: "NUMBER", description: "Percentuale spese fisse." },
          tempoLibero: { type: "NUMBER", description: "Percentuale tempo libero." },
          risparmi: { type: "NUMBER", description: "Percentuale risparmi." },
        },
        required: ["speseFisse", "tempoLibero", "risparmi"],
      },
    },
    execute: (args, ctx) => {
      const { setSalarySplit } = financeCtx(ctx);
      setSalarySplit({ speseFisse: Number(args.speseFisse), tempoLibero: Number(args.tempoLibero), risparmi: Number(args.risparmi) });
      return `Ripartizione stipendio impostata: ${args.speseFisse}/${args.tempoLibero}/${args.risparmi}.`;
    },
  },

  crea_spesa_ricorrente: {
    declaration: {
      name: "crea_spesa_ricorrente",
      description: "Crea una nuova spesa ricorrente (es. abbonamento, affitto).",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Descrizione della spesa ricorrente." },
          amount: { type: "NUMBER", description: "Importo in euro." },
          category: { type: "STRING", enum: EXPENSE_CATEGORIES, description: "Categoria." },
          recurrence: { type: "STRING", enum: EXPENSE_RECURRENCES, description: "Frequenza." },
        },
        required: ["label", "amount", "category", "recurrence"],
      },
    },
    execute: (args, ctx) => {
      const { addRecurringExpense } = financeCtx(ctx);
      addRecurringExpense(String(args.label), Number(args.amount), args.category as ExpenseCategory, args.recurrence as ExpenseRecurrence);
      return `Spesa ricorrente "${args.label}" creata (${args.recurrence}, ${args.amount}€).`;
    },
  },

  attiva_disattiva_spesa_ricorrente: {
    declaration: {
      name: "attiva_disattiva_spesa_ricorrente",
      description: "Attiva o disattiva una spesa ricorrente esistente, cercandola per descrizione.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Descrizione (anche parziale) della spesa ricorrente." } },
        required: ["label"],
      },
    },
    execute: (args, ctx) => {
      const { recurringExpenses, toggleRecurringExpense } = financeCtx(ctx);
      const found = findRecurringByLabel(recurringExpenses, String(args.label));
      if (!found) return `Non ho trovato nessuna spesa ricorrente con descrizione simile a "${args.label}".`;
      toggleRecurringExpense(found.id);
      return `Spesa ricorrente "${found.label}" ${found.active ? "disattivata" : "attivata"}.`;
    },
  },

  elimina_spesa_ricorrente: {
    declaration: {
      name: "elimina_spesa_ricorrente",
      description: "Elimina definitivamente una spesa ricorrente, cercandola per descrizione. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Descrizione (anche parziale) della spesa ricorrente." } },
        required: ["label"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { recurringExpenses, removeRecurringExpense } = financeCtx(ctx);
      const found = findRecurringByLabel(recurringExpenses, String(args.label));
      if (!found) return `Non ho trovato nessuna spesa ricorrente con descrizione simile a "${args.label}".`;
      removeRecurringExpense(found.id);
      return `Spesa ricorrente "${found.label}" eliminata.`;
    },
  },

  crea_spesa_pianificata: {
    declaration: {
      name: "crea_spesa_pianificata",
      description: "Crea una spesa pianificata (una tantum) con una data di scadenza da pagare.",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Descrizione della spesa." },
          amount: { type: "NUMBER", description: "Importo in euro." },
          dueDate: { type: "STRING", description: "Data di scadenza YYYY-MM-DD." },
          category: { type: "STRING", enum: EXPENSE_CATEGORIES, description: "Categoria." },
        },
        required: ["label", "amount", "dueDate", "category"],
      },
    },
    execute: (args, ctx) => {
      const { addPlannedExpense } = financeCtx(ctx);
      addPlannedExpense(String(args.label), Number(args.amount), String(args.dueDate), args.category as ExpenseCategory);
      return `Spesa pianificata "${args.label}" creata, scadenza ${args.dueDate}.`;
    },
  },

  segna_spesa_pianificata_pagata: {
    declaration: {
      name: "segna_spesa_pianificata_pagata",
      description: "Segna come pagata una spesa pianificata, cercandola per descrizione — la trasforma in una spesa singola registrata.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Descrizione (anche parziale) della spesa pianificata." } },
        required: ["label"],
      },
    },
    execute: (args, ctx) => {
      const { plannedExpenses, markPlannedPaid } = financeCtx(ctx);
      const found = findPlannedByLabel(plannedExpenses, String(args.label));
      if (!found) return `Non ho trovato nessuna spesa pianificata con descrizione simile a "${args.label}".`;
      markPlannedPaid(found.id);
      return `Spesa pianificata "${found.label}" segnata come pagata.`;
    },
  },

  elimina_spesa_pianificata: {
    declaration: {
      name: "elimina_spesa_pianificata",
      description: "Elimina una spesa pianificata non ancora pagata, cercandola per descrizione. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Descrizione (anche parziale) della spesa pianificata." } },
        required: ["label"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { plannedExpenses, removePlannedExpense } = financeCtx(ctx);
      const found = findPlannedByLabel(plannedExpenses, String(args.label));
      if (!found) return `Non ho trovato nessuna spesa pianificata con descrizione simile a "${args.label}".`;
      removePlannedExpense(found.id);
      return `Spesa pianificata "${found.label}" eliminata.`;
    },
  },

  crea_obiettivo_risparmio: {
    declaration: {
      name: "crea_obiettivo_risparmio",
      description: "Crea un nuovo obiettivo di risparmio in Finanze.",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Nome dell'obiettivo (es. 'Viaggio in Giappone')." },
          targetAmount: { type: "NUMBER", description: "Importo obiettivo in euro." },
        },
        required: ["label", "targetAmount"],
      },
    },
    execute: (args, ctx) => {
      const { addSavingsGoal } = financeCtx(ctx);
      addSavingsGoal(String(args.label), Number(args.targetAmount));
      return `Obiettivo "${args.label}" creato, target ${Number(args.targetAmount).toLocaleString("it-IT")}€.`;
    },
  },

  versa_su_obiettivo: {
    declaration: {
      name: "versa_su_obiettivo",
      description: "Versa una somma positiva su un obiettivo di risparmio esistente, cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Nome (anche parziale) dell'obiettivo." },
          amount: { type: "NUMBER", description: "Importo positivo da versare." },
        },
        required: ["label", "amount"],
      },
    },
    execute: (args, ctx) => {
      const { savingsGoals, contributeSavingsGoal } = financeCtx(ctx);
      const goal = findGoalByLabel(savingsGoals, String(args.label));
      if (!goal) return `Non ho trovato nessun obiettivo con nome simile a "${args.label}".`;
      contributeSavingsGoal(goal.id, Math.abs(Number(args.amount)));
      return `Versati ${Math.abs(Number(args.amount)).toLocaleString("it-IT")}€ su "${goal.label}".`;
    },
  },

  preleva_da_obiettivo: {
    declaration: {
      name: "preleva_da_obiettivo",
      description: "Preleva una somma da un obiettivo di risparmio esistente, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Nome (anche parziale) dell'obiettivo." },
          amount: { type: "NUMBER", description: "Importo positivo da prelevare." },
        },
        required: ["label", "amount"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { savingsGoals, contributeSavingsGoal } = financeCtx(ctx);
      const goal = findGoalByLabel(savingsGoals, String(args.label));
      if (!goal) return `Non ho trovato nessun obiettivo con nome simile a "${args.label}".`;
      contributeSavingsGoal(goal.id, -Math.abs(Number(args.amount)));
      return `Prelevati ${Math.abs(Number(args.amount)).toLocaleString("it-IT")}€ da "${goal.label}".`;
    },
  },

  elimina_obiettivo_risparmio: {
    declaration: {
      name: "elimina_obiettivo_risparmio",
      description: "Elimina un obiettivo di risparmio, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { label: { type: "STRING", description: "Nome (anche parziale) dell'obiettivo da eliminare." } },
        required: ["label"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { savingsGoals, removeSavingsGoal } = financeCtx(ctx);
      const goal = findGoalByLabel(savingsGoals, String(args.label));
      if (!goal) return `Non ho trovato nessun obiettivo con nome simile a "${args.label}".`;
      removeSavingsGoal(goal.id);
      return `Obiettivo "${goal.label}" eliminato.`;
    },
  },

  deposita_nel_salvadanaio: {
    declaration: {
      name: "deposita_nel_salvadanaio",
      description: "Deposita una somma positiva nel salvadanaio generale (non un obiettivo specifico).",
      parameters: {
        type: "OBJECT",
        properties: {
          amount: { type: "NUMBER", description: "Importo positivo da depositare." },
          note: { type: "STRING", description: "Nota facoltativa sul movimento." },
        },
        required: ["amount"],
      },
    },
    execute: (args, ctx) => {
      const { addSavingsEntry } = financeCtx(ctx);
      addSavingsEntry(Math.abs(Number(args.amount)), args.note ? String(args.note) : undefined);
      return `Depositati ${Math.abs(Number(args.amount)).toLocaleString("it-IT")}€ nel salvadanaio.`;
    },
  },

  preleva_dal_salvadanaio: {
    declaration: {
      name: "preleva_dal_salvadanaio",
      description: "Preleva una somma dal salvadanaio generale. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: {
          amount: { type: "NUMBER", description: "Importo positivo da prelevare." },
          note: { type: "STRING", description: "Nota facoltativa sul movimento." },
        },
        required: ["amount"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { addSavingsEntry } = financeCtx(ctx);
      addSavingsEntry(-Math.abs(Number(args.amount)), args.note ? String(args.note) : undefined);
      return `Prelevati ${Math.abs(Number(args.amount)).toLocaleString("it-IT")}€ dal salvadanaio.`;
    },
  },

  stato_finanze: {
    declaration: {
      name: "stato_finanze",
      description: "Restituisce budget mensile, saldo salvadanaio e obiettivi di risparmio attuali — usalo per rispondere a domande sullo stato delle finanze.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { monthlyBudget, savingsEntries, savingsGoals } = financeCtx(ctx);
      const balance = savingsEntries.reduce((s, e) => s + e.amount, 0);
      const goalsDesc = savingsGoals.length
        ? savingsGoals.map((g) => `${g.label}: ${g.currentAmount}/${g.targetAmount}€`).join("; ")
        : "nessun obiettivo attivo";
      return `Budget mensile: ${monthlyBudget !== null ? monthlyBudget + "€" : "non impostato"}. Salvadanaio: ${balance.toLocaleString("it-IT")}€. Obiettivi: ${goalsDesc}.`;
    },
  },
};
