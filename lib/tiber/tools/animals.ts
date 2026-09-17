import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Person } from "@/lib/types";
import {
  AnimalVaccination,
  AnimalMedication,
  AnimalAppointment,
  AnimalReport,
  AnimalAllergy,
  AnimalWeightEntry,
} from "@/lib/animal-health-context";
import { FoodProduct, FoodScope } from "@/lib/animal-food-context";
import { todayIso } from "@/lib/date-format";

interface AnimalHealthCtx {
  vaccinations: AnimalVaccination[];
  addVaccination: (v: Omit<AnimalVaccination, "id">) => void;
  removeVaccination: (id: string) => void;
  medications: AnimalMedication[];
  addMedication: (m: Omit<AnimalMedication, "id">) => void;
  removeMedication: (id: string) => void;
  appointments: AnimalAppointment[];
  addAppointment: (a: Omit<AnimalAppointment, "id">) => void;
  removeAppointment: (id: string) => void;
  reports: AnimalReport[];
  addReport: (r: Omit<AnimalReport, "id">) => void;
  removeReport: (id: string) => void;
  allergies: AnimalAllergy[];
  addAllergy: (a: Omit<AnimalAllergy, "id">) => void;
  removeAllergy: (id: string) => void;
  weightEntries: AnimalWeightEntry[];
  addWeightEntry: (w: Omit<AnimalWeightEntry, "id">) => void;
  removeWeightEntry: (id: string) => void;
}

interface AnimalFoodCtx {
  products: FoodProduct[];
  addProduct: (input: Omit<FoodProduct, "id" | "createdAt" | "portionsRemaining" | "exhausted" | "lowStockAlerted">) => FoodProduct;
  consumePortion: (id: string) => void;
  markRepurchased: (id: string) => void;
  removeProduct: (id: string) => void;
}

interface AnimalsCtx {
  people: Person[];
  health: AnimalHealthCtx;
  food: AnimalFoodCtx;
}

function animalsCtx(ctx: TiberExecutionContext): AnimalsCtx {
  return ctxField<AnimalsCtx>(ctx, "animals");
}

const ANIMAL_KINDS = ["cane", "gatto"];

function findAnimalByName(people: Person[], name: string): Person | undefined {
  const needle = name.trim().toLowerCase();
  const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));
  return (
    animals.find((a) => a.firstName.trim().toLowerCase() === needle) ??
    animals.find((a) => a.firstName.trim().toLowerCase().includes(needle))
  );
}

function byNameNeedle<T extends { name: string }>(items: T[], needle: string): T | undefined {
  const n = needle.trim().toLowerCase();
  return items.find((i) => i.name.trim().toLowerCase().includes(n));
}

export const animalTools: Record<string, TiberToolDefinition> = {
  registra_vaccinazione_animale: {
    declaration: {
      name: "registra_vaccinazione_animale",
      description: "Registra una vaccinazione fatta a un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          vaccineName: { type: "string", description: "Nome del vaccino." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
          nextDueDate: { type: "string", description: "Data del prossimo richiamo, se previsto." },
        },
        required: ["animalName", "vaccineName"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addVaccination({
        animalId: animal.id,
        name: String(args.vaccineName),
        date: args.date ? String(args.date) : todayIso(),
        nextDueDate: args.nextDueDate ? String(args.nextDueDate) : undefined,
      });
      return `Vaccinazione "${args.vaccineName}" registrata per ${animal.firstName}.`;
    },
  },

  elimina_vaccinazione_animale: {
    declaration: {
      name: "elimina_vaccinazione_animale",
      description: "Rimuove una vaccinazione di un animale, cercandola per nome vaccino. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { vaccineName: { type: "string", description: "Nome (anche parziale) del vaccino." } },
        required: ["vaccineName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { health } = animalsCtx(ctx);
      const found = byNameNeedle(health.vaccinations, String(args.vaccineName));
      if (!found) return `Non ho trovato nessuna vaccinazione con nome simile a "${args.vaccineName}".`;
      health.removeVaccination(found.id);
      return `Vaccinazione "${found.name}" rimossa.`;
    },
  },

  registra_farmaco_animale: {
    declaration: {
      name: "registra_farmaco_animale",
      description: "Registra un farmaco in corso per un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          medicationName: { type: "string", description: "Nome del farmaco." },
          dosage: { type: "string", description: "Dosaggio, se noto." },
        },
        required: ["animalName", "medicationName"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addMedication({ animalId: animal.id, name: String(args.medicationName), dosage: args.dosage ? String(args.dosage) : undefined, times: [], startDate: todayIso() });
      return `Farmaco "${args.medicationName}" registrato per ${animal.firstName}.`;
    },
  },

  elimina_farmaco_animale: {
    declaration: {
      name: "elimina_farmaco_animale",
      description: "Rimuove un farmaco di un animale, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { medicationName: { type: "string", description: "Nome (anche parziale) del farmaco." } },
        required: ["medicationName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { health } = animalsCtx(ctx);
      const found = byNameNeedle(health.medications, String(args.medicationName));
      if (!found) return `Non ho trovato nessun farmaco con nome simile a "${args.medicationName}".`;
      health.removeMedication(found.id);
      return `Farmaco "${found.name}" rimosso.`;
    },
  },

  aggiungi_appuntamento_veterinario: {
    declaration: {
      name: "aggiungi_appuntamento_veterinario",
      description: "Aggiunge un appuntamento veterinario per un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          title: { type: "string", description: "Motivo della visita." },
          date: { type: "string", description: "Data YYYY-MM-DD." },
          vetName: { type: "string", description: "Nome del veterinario, se noto." },
        },
        required: ["animalName", "title", "date"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addAppointment({ animalId: animal.id, title: String(args.title), vetName: args.vetName ? String(args.vetName) : undefined, date: String(args.date), completed: false });
      return `Appuntamento veterinario "${args.title}" aggiunto per ${animal.firstName} il ${args.date}.`;
    },
  },

  elimina_appuntamento_veterinario: {
    declaration: {
      name: "elimina_appuntamento_veterinario",
      description: "Elimina un appuntamento veterinario, cercandolo per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { title: { type: "string", description: "Titolo (anche parziale) dell'appuntamento." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { health } = animalsCtx(ctx);
      const needle = String(args.title).trim().toLowerCase();
      const found = health.appointments.find((a) => a.title.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessun appuntamento con titolo simile a "${args.title}".`;
      health.removeAppointment(found.id);
      return `Appuntamento "${found.title}" eliminato.`;
    },
  },

  aggiungi_referto_animale: {
    declaration: {
      name: "aggiungi_referto_animale",
      description: "Aggiunge un referto (analisi, visita, intervento) per un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          title: { type: "string", description: "Titolo del referto." },
          type: { type: "string", description: "Tipo libero (es. 'Analisi', 'Intervento')." },
          date: { type: "string", description: "Data YYYY-MM-DD." },
        },
        required: ["animalName", "title", "type", "date"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addReport({ animalId: animal.id, title: String(args.title), type: String(args.type), date: String(args.date) });
      return `Referto "${args.title}" aggiunto per ${animal.firstName}.`;
    },
  },

  elimina_referto_animale: {
    declaration: {
      name: "elimina_referto_animale",
      description: "Rimuove un referto di un animale, cercandolo per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { title: { type: "string", description: "Titolo (anche parziale) del referto." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { health } = animalsCtx(ctx);
      const needle = String(args.title).trim().toLowerCase();
      const found = health.reports.find((r) => r.title.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessun referto con titolo simile a "${args.title}".`;
      health.removeReport(found.id);
      return `Referto "${found.title}" rimosso.`;
    },
  },

  aggiungi_allergia_animale: {
    declaration: {
      name: "aggiungi_allergia_animale",
      description: "Aggiunge un'allergia nota per un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          name: { type: "string", description: "Nome dell'allergene." },
          severity: { type: "string", enum: ["lieve", "moderata", "grave"], description: "Gravità della reazione." },
        },
        required: ["animalName", "name"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addAllergy({ animalId: animal.id, name: String(args.name), severity: args.severity as AnimalAllergy["severity"] });
      return `Allergia a "${args.name}" registrata per ${animal.firstName}.`;
    },
  },

  elimina_allergia_animale: {
    declaration: {
      name: "elimina_allergia_animale",
      description: "Rimuove un'allergia di un animale, cercandola per nome allergene. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nome (anche parziale) dell'allergene." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { health } = animalsCtx(ctx);
      const found = byNameNeedle(health.allergies, String(args.name));
      if (!found) return `Non ho trovato nessuna allergia con nome simile a "${args.name}".`;
      health.removeAllergy(found.id);
      return `Allergia a "${found.name}" rimossa.`;
    },
  },

  registra_peso_animale: {
    declaration: {
      name: "registra_peso_animale",
      description: "Registra il peso attuale di un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale." },
          value: { type: "number", description: "Peso in kg." },
        },
        required: ["animalName", "value"],
      },
    },
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      health.addWeightEntry({ animalId: animal.id, date: todayIso(), value: Number(args.value) });
      return `Peso di ${animal.firstName} registrato: ${args.value} kg.`;
    },
  },

  elimina_peso_animale: {
    declaration: {
      name: "elimina_peso_animale",
      description: "Rimuove l'ultima pesata registrata di un animale, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { animalName: { type: "string", description: "Nome dell'animale." } },
        required: ["animalName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { people, health } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      const matches = health.weightEntries.filter((w) => w.animalId === animal.id).sort((a, b) => b.date.localeCompare(a.date));
      if (matches.length === 0) return `Nessuna pesata registrata per ${animal.firstName}.`;
      health.removeWeightEntry(matches[0].id);
      return `Ultima pesata di ${animal.firstName} rimossa.`;
    },
  },

  crea_prodotto_cibo_animale: {
    declaration: {
      name: "crea_prodotto_cibo_animale",
      description: "Crea un nuovo prodotto alimentare per un animale, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          animalName: { type: "string", description: "Nome dell'animale a cui è destinato." },
          productName: { type: "string", description: "Nome del prodotto." },
          brand: { type: "string", description: "Marca, se nota." },
          unitsTotal: { type: "number", description: "Numero di unità nella confezione (es. 24 lattine)." },
          portionsPerUnit: { type: "number", description: "Porzioni per unità (es. 1 porzione a lattina)." },
        },
        required: ["animalName", "productName", "unitsTotal", "portionsPerUnit"],
      },
    },
    execute: (args, ctx) => {
      const { people, food } = animalsCtx(ctx);
      const animal = findAnimalByName(people, String(args.animalName));
      if (!animal) return `Non ho trovato nessun animale con nome simile a "${args.animalName}".`;
      const scope: FoodScope = { type: "animal", animalId: animal.id };
      const created = food.addProduct({
        name: String(args.productName),
        brand: args.brand ? String(args.brand) : undefined,
        unitsTotal: Number(args.unitsTotal),
        portionsPerUnit: Number(args.portionsPerUnit),
        scope,
      });
      return `Prodotto "${created.name}" creato per ${animal.firstName}.`;
    },
  },

  consuma_porzione_cibo_animale: {
    declaration: {
      name: "consuma_porzione_cibo_animale",
      description: "Scala una porzione dal prodotto alimentare per animali indicato, cercandolo per nome prodotto.",
      parameters: {
        type: "object",
        properties: { productName: { type: "string", description: "Nome (anche parziale) del prodotto." } },
        required: ["productName"],
      },
    },
    execute: (args, ctx) => {
      const { food } = animalsCtx(ctx);
      const needle = String(args.productName).trim().toLowerCase();
      const product = food.products.find((p) => p.name.trim().toLowerCase().includes(needle) && !p.exhausted);
      if (!product) return `Non ho trovato nessun prodotto attivo con nome simile a "${args.productName}".`;
      food.consumePortion(product.id);
      return `Porzione di "${product.name}" scalata.`;
    },
  },

  segna_prodotto_riacquistato: {
    declaration: {
      name: "segna_prodotto_riacquistato",
      description: "Segna un prodotto alimentare per animali come riacquistato, riportando le porzioni al massimo.",
      parameters: {
        type: "object",
        properties: { productName: { type: "string", description: "Nome (anche parziale) del prodotto." } },
        required: ["productName"],
      },
    },
    execute: (args, ctx) => {
      const { food } = animalsCtx(ctx);
      const needle = String(args.productName).trim().toLowerCase();
      const product = food.products.find((p) => p.name.trim().toLowerCase().includes(needle));
      if (!product) return `Non ho trovato nessun prodotto con nome simile a "${args.productName}".`;
      food.markRepurchased(product.id);
      return `"${product.name}" segnato come riacquistato.`;
    },
  },

  elimina_prodotto_cibo_animale: {
    declaration: {
      name: "elimina_prodotto_cibo_animale",
      description: "Elimina definitivamente un prodotto alimentare per animali, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { productName: { type: "string", description: "Nome (anche parziale) del prodotto." } },
        required: ["productName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { food } = animalsCtx(ctx);
      const needle = String(args.productName).trim().toLowerCase();
      const product = food.products.find((p) => p.name.trim().toLowerCase().includes(needle));
      if (!product) return `Non ho trovato nessun prodotto con nome simile a "${args.productName}".`;
      food.removeProduct(product.id);
      return `Prodotto "${product.name}" eliminato.`;
    },
  },
};
