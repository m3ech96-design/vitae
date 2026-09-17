import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Ingredient, FoodEntry, PantryEntry, MealSlot, FoodGoals } from "@/lib/food-types";
import { todayIso } from "@/lib/date-format";

interface FoodCtx {
  ingredients: Ingredient[];
  addIngredient: (input: Omit<Ingredient, "id" | "createdAt">) => Ingredient;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id" | "createdAt">>) => void;
  removeIngredient: (id: string) => void;
  entries: FoodEntry[];
  addEntry: (input: Omit<FoodEntry, "id" | "createdAt">) => FoodEntry;
  removeEntry: (id: string) => void;
  setWater: (date: string, liters: number) => void;
  setGoals: (patch: Partial<FoodGoals>) => void;
  pantryEntries: PantryEntry[];
  addPantryEntry: (input: Omit<PantryEntry, "id">) => void;
  markPantryEntryConsumed: (id: string, consumedDate: string) => void;
  removePantryEntry: (id: string) => void;
}

function foodCtx(ctx: TiberExecutionContext): FoodCtx {
  return ctxField<FoodCtx>(ctx, "food");
}

const MEAL_SLOTS: MealSlot[] = ["colazione", "pranzo", "cena", "spuntino-mattina", "spuntino-pomeriggio", "spuntino-sera"];

function findIngredientByName(ingredients: Ingredient[], name: string): Ingredient | undefined {
  const needle = name.trim().toLowerCase();
  return (
    ingredients.find((i) => i.name.trim().toLowerCase() === needle) ??
    ingredients.find((i) => i.name.trim().toLowerCase().includes(needle))
  );
}

export const foodTools: Record<string, TiberToolDefinition> = {
  registra_pasto: {
    declaration: {
      name: "registra_pasto",
      description:
        "Registra un ingrediente/ricetta consumato in un pasto del menù, cercando l'ingrediente per nome (deve già esistere in Alimentazione).",
      parameters: {
        type: "object",
        properties: {
          ingredientName: { type: "string", description: "Nome dell'ingrediente o ricetta già esistente." },
          slot: { type: "string", enum: MEAL_SLOTS, description: "Pasto in cui registrarlo." },
          quantity: { type: "number", description: "Quantità nell'unità propria dell'ingrediente (g, ml o conteggio)." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["ingredientName", "slot", "quantity"],
      },
    },
    execute: (args, ctx) => {
      const { ingredients, addEntry } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.ingredientName));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.ingredientName}". Va creato prima in Alimentazione.`;
      const date = args.date ? String(args.date) : todayIso();
      addEntry({
        date,
        slot: args.slot as MealSlot,
        ingredientId: ingredient.id,
        quantity: Number(args.quantity),
        time: new Date().toTimeString().slice(0, 5),
      });
      return `Registrato "${ingredient.name}" (${args.quantity}) nel pasto ${args.slot} del ${date}.`;
    },
  },

  elimina_pasto_registrato: {
    declaration: {
      name: "elimina_pasto_registrato",
      description: "Rimuove l'ultima registrazione di un ingrediente in un pasto di una data, cercandolo per nome ingrediente. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          ingredientName: { type: "string", description: "Nome (anche parziale) dell'ingrediente registrato." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["ingredientName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { ingredients, entries, removeEntry } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.ingredientName));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.ingredientName}".`;
      const date = args.date ? String(args.date) : todayIso();
      const match = entries.filter((e) => e.ingredientId === ingredient.id && e.date === date).sort((a, b) => b.time.localeCompare(a.time))[0];
      if (!match) return `Nessuna registrazione di "${ingredient.name}" trovata per il ${date}.`;
      removeEntry(match.id);
      return `Registrazione di "${ingredient.name}" del ${date} rimossa.`;
    },
  },

  crea_ingrediente: {
    declaration: {
      name: "crea_ingrediente",
      description: "Crea un nuovo ingrediente nel catalogo Alimentazione, con i valori nutrizionali per 100g (o per 100ml se liquido).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome dell'ingrediente." },
          unit: { type: "string", enum: ["g", "ml", "altro"], description: "Unità di misura." },
          fat: { type: "number", description: "Grassi per 100." },
          saturatedFat: { type: "number", description: "Di cui saturi, per 100." },
          carbs: { type: "number", description: "Carboidrati per 100." },
          sugars: { type: "number", description: "Di cui zuccheri, per 100." },
          fiber: { type: "number", description: "Fibre per 100." },
          protein: { type: "number", description: "Proteine per 100." },
          salt: { type: "number", description: "Sale per 100." },
        },
        required: ["name", "unit", "fat", "carbs", "protein"],
      },
    },
    execute: (args, ctx) => {
      const { addIngredient } = foodCtx(ctx);
      const fat = Number(args.fat) || 0;
      const carbs = Number(args.carbs) || 0;
      const protein = Number(args.protein) || 0;
      const created = addIngredient({
        name: String(args.name),
        unit: (args.unit as Ingredient["unit"]) ?? "g",
        fat,
        saturatedFat: Number(args.saturatedFat) || 0,
        carbs,
        sugars: Number(args.sugars) || 0,
        fiber: Number(args.fiber) || 0,
        protein,
        salt: Number(args.salt) || 0,
        kcal: Math.round(fat * 9 + carbs * 4 + protein * 4),
      });
      return `Ingrediente "${created.name}" creato.`;
    },
  },

  modifica_ingrediente: {
    declaration: {
      name: "modifica_ingrediente",
      description: "Modifica i valori nutrizionali o il nome di un ingrediente esistente, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome (anche parziale) dell'ingrediente da modificare." },
          newName: { type: "string", description: "Nuovo nome, se da cambiare." },
          fat: { type: "number", description: "Nuovi grassi per 100." },
          carbs: { type: "number", description: "Nuovi carboidrati per 100." },
          protein: { type: "number", description: "Nuove proteine per 100." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { ingredients, updateIngredient } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.name));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.name}".`;
      const patch: Partial<Ingredient> = {};
      if (args.newName) patch.name = String(args.newName);
      if (args.fat !== undefined) patch.fat = Number(args.fat);
      if (args.carbs !== undefined) patch.carbs = Number(args.carbs);
      if (args.protein !== undefined) patch.protein = Number(args.protein);
      updateIngredient(ingredient.id, patch);
      return `Ingrediente "${ingredient.name}" aggiornato.`;
    },
  },

  elimina_ingrediente: {
    declaration: {
      name: "elimina_ingrediente",
      description: "Elimina definitivamente un ingrediente dal catalogo, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nome (anche parziale) dell'ingrediente da eliminare." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { ingredients, removeIngredient } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.name));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.name}".`;
      removeIngredient(ingredient.id);
      return `Ingrediente "${ingredient.name}" eliminato.`;
    },
  },

  imposta_obiettivi_alimentari: {
    declaration: {
      name: "imposta_obiettivi_alimentari",
      description: "Imposta gli obiettivi calorici giornalieri e/o l'obiettivo di litri d'acqua.",
      parameters: {
        type: "object",
        properties: {
          dailyKcalMax: { type: "number", description: "Massimo di calorie giornaliere." },
          dailyKcalMin: { type: "number", description: "Minimo di calorie giornaliere." },
          waterGoalLiters: { type: "number", description: "Obiettivo litri d'acqua al giorno." },
        },
      },
    },
    execute: (args, ctx) => {
      const { setGoals } = foodCtx(ctx);
      const patch: Partial<FoodGoals> = {};
      if (args.dailyKcalMax !== undefined) patch.dailyKcalMax = Number(args.dailyKcalMax);
      if (args.dailyKcalMin !== undefined) patch.dailyKcalMin = Number(args.dailyKcalMin);
      if (args.waterGoalLiters !== undefined) patch.waterGoalLiters = Number(args.waterGoalLiters);
      setGoals(patch);
      return "Obiettivi alimentari aggiornati.";
    },
  },

  segna_acqua: {
    declaration: {
      name: "segna_acqua",
      description: "Imposta i litri d'acqua bevuti in una data (sostituisce il valore del giorno, non lo somma).",
      parameters: {
        type: "object",
        properties: {
          liters: { type: "number", description: "Litri totali bevuti quel giorno." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["liters"],
      },
    },
    execute: (args, ctx) => {
      const { setWater } = foodCtx(ctx);
      const date = args.date ? String(args.date) : todayIso();
      setWater(date, Number(args.liters));
      return `Segnati ${args.liters} litri d'acqua per il ${date}.`;
    },
  },

  aggiungi_a_dispensa: {
    declaration: {
      name: "aggiungi_a_dispensa",
      description: "Registra un acquisto in dispensa per un ingrediente esistente, con scadenza facoltativa scritta a mano.",
      parameters: {
        type: "object",
        properties: {
          ingredientName: { type: "string", description: "Nome dell'ingrediente già esistente." },
          expiryDate: { type: "string", description: "Scadenza YYYY-MM-DD, se presente sulla confezione." },
          initialQuantity: { type: "number", description: "Quantità iniziale acquistata, nell'unità dell'ingrediente." },
        },
        required: ["ingredientName"],
      },
    },
    execute: (args, ctx) => {
      const { ingredients, addPantryEntry } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.ingredientName));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.ingredientName}".`;
      addPantryEntry({
        ingredientId: ingredient.id,
        purchasedDate: todayIso(),
        expiryDateOverride: args.expiryDate ? String(args.expiryDate) : undefined,
        initialQuantity: args.initialQuantity ? Number(args.initialQuantity) : undefined,
        remainingQuantity: args.initialQuantity ? Number(args.initialQuantity) : undefined,
      });
      return `"${ingredient.name}" aggiunto in dispensa${args.expiryDate ? `, scadenza ${args.expiryDate}` : ""}.`;
    },
  },

  segna_dispensa_consumata: {
    declaration: {
      name: "segna_dispensa_consumata",
      description: "Segna come consumato/buttato un acquisto in dispensa, cercandolo per nome ingrediente.",
      parameters: {
        type: "object",
        properties: { ingredientName: { type: "string", description: "Nome (anche parziale) dell'ingrediente in dispensa." } },
        required: ["ingredientName"],
      },
    },
    execute: (args, ctx) => {
      const { ingredients, pantryEntries, markPantryEntryConsumed } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.ingredientName));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.ingredientName}".`;
      const entry = pantryEntries.find((e) => e.ingredientId === ingredient.id && !e.consumedDate);
      if (!entry) return `Nessun acquisto attivo in dispensa per "${ingredient.name}".`;
      markPantryEntryConsumed(entry.id, todayIso());
      return `"${ingredient.name}" segnato come consumato in dispensa.`;
    },
  },

  rimuovi_da_dispensa: {
    declaration: {
      name: "rimuovi_da_dispensa",
      description: "Rimuove definitivamente un acquisto dalla dispensa (non solo segnarlo consumato), cercandolo per nome ingrediente. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { ingredientName: { type: "string", description: "Nome (anche parziale) dell'ingrediente in dispensa." } },
        required: ["ingredientName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { ingredients, pantryEntries, removePantryEntry } = foodCtx(ctx);
      const ingredient = findIngredientByName(ingredients, String(args.ingredientName));
      if (!ingredient) return `Non ho trovato nessun ingrediente con nome simile a "${args.ingredientName}".`;
      const entry = pantryEntries.find((e) => e.ingredientId === ingredient.id);
      if (!entry) return `Nessun acquisto in dispensa per "${ingredient.name}".`;
      removePantryEntry(entry.id);
      return `Acquisto di "${ingredient.name}" rimosso dalla dispensa.`;
    },
  },

  elenca_dispensa: {
    declaration: {
      name: "elenca_dispensa",
      description: "Elenca gli acquisti attivi (non consumati) in dispensa, con scadenza se presente.",
      parameters: { type: "object", properties: {} },
    },
    execute: (_args, ctx) => {
      const { ingredients, pantryEntries } = foodCtx(ctx);
      const active = pantryEntries.filter((e) => !e.consumedDate);
      if (active.length === 0) return "La dispensa risulta vuota.";
      return active
        .map((e) => {
          const ing = ingredients.find((i) => i.id === e.ingredientId);
          return `${ing?.name ?? "ingrediente sconosciuto"}${e.expiryDateOverride ? ` (scade ${e.expiryDateOverride})` : ""}`;
        })
        .join("; ");
    },
  },
};
