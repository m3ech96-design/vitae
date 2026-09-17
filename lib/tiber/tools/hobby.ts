import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import {
  Hobby,
  HobbyBlockKind,
  MetricEntry,
  ChecklistItem,
  ChecklistStatus,
  InventoryItem,
  Project,
  ProjectStatus,
  LibraryItem,
  LibraryStatus,
  Match,
  MatchResult,
} from "@/lib/hobby-types";

interface HobbyCtx {
  hobbies: Hobby[];
  addHobby: (input: { name: string; details: Hobby["details"] }) => Hobby;
  removeHobby: (id: string) => void;
  addBlock: (hobbyId: string, kind: HobbyBlockKind, title: string) => void;
  removeBlock: (hobbyId: string, blockId: string) => void;
  addMetricEntry: (hobbyId: string, blockId: string, input: Omit<MetricEntry, "id">) => void;
  addChecklistItem: (hobbyId: string, blockId: string, input: Omit<ChecklistItem, "id" | "createdAt">) => void;
  updateChecklistItem: (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<ChecklistItem, "id" | "createdAt">>) => void;
  removeChecklistItem: (hobbyId: string, blockId: string, itemId: string) => void;
  addInventoryItem: (hobbyId: string, blockId: string, input: Omit<InventoryItem, "id" | "createdAt">) => void;
  removeInventoryItem: (hobbyId: string, blockId: string, itemId: string) => void;
  addProject: (hobbyId: string, blockId: string, input: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (hobbyId: string, blockId: string, projectId: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => void;
  removeProject: (hobbyId: string, blockId: string, projectId: string) => void;
  addLibraryItem: (hobbyId: string, blockId: string, input: Omit<LibraryItem, "id" | "createdAt">) => void;
  updateLibraryItem: (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<LibraryItem, "id" | "createdAt">>) => void;
  removeLibraryItem: (hobbyId: string, blockId: string, itemId: string) => void;
  addMatch: (hobbyId: string, blockId: string, input: Omit<Match, "id" | "createdAt">) => void;
  removeMatch: (hobbyId: string, blockId: string, matchId: string) => void;
}

function hobbyCtx(ctx: TiberExecutionContext): HobbyCtx {
  return ctxField<HobbyCtx>(ctx, "hobby");
}

const BLOCK_KINDS: HobbyBlockKind[] = ["checklist", "metrica", "inventario", "progetti", "libreria", "partite"];
const CHECKLIST_STATUSES: ChecklistStatus[] = ["da-fare", "in-corso", "fatta"];
const PROJECT_STATUSES: ProjectStatus[] = ["idea", "in-corso", "in-pausa", "finito", "abbandonato"];
const LIBRARY_STATUSES: LibraryStatus[] = ["da-provare", "in-corso", "completato", "abbandonato"];
const MATCH_RESULTS: MatchResult[] = ["vittoria", "sconfitta", "pareggio"];

function findHobbyByName(hobbies: Hobby[], name: string): Hobby | undefined {
  const needle = name.trim().toLowerCase();
  return (
    hobbies.find((h) => h.name.trim().toLowerCase() === needle) ??
    hobbies.find((h) => h.name.trim().toLowerCase().includes(needle))
  );
}

function findBlock(hobby: Hobby, kind: HobbyBlockKind, blockTitle?: string) {
  const blocks = hobby.blocks.filter((b) => b.kind === kind);
  if (blocks.length === 0) return undefined;
  if (!blockTitle) return blocks[0];
  const needle = blockTitle.trim().toLowerCase();
  return blocks.find((b) => b.title.trim().toLowerCase().includes(needle)) ?? blocks[0];
}

export const hobbyTools: Record<string, TiberToolDefinition> = {
  crea_hobby: {
    declaration: {
      name: "crea_hobby",
      description: "Crea un nuovo hobby vuoto, a cui poi si possono aggiungere blocchi (Checklist, Metrica, Inventario, Progetti, Libreria, Partite).",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nome dell'hobby." } },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addHobby } = hobbyCtx(ctx);
      const created = addHobby({ name: String(args.name), details: [] });
      return `Hobby "${created.name}" creato.`;
    },
  },

  elimina_hobby: {
    declaration: {
      name: "elimina_hobby",
      description: "Elimina definitivamente un hobby e tutti i suoi blocchi, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nome (anche parziale) dell'hobby." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeHobby } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.name));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.name}".`;
      removeHobby(hobby.id);
      return `Hobby "${hobby.name}" eliminato.`;
    },
  },

  aggiungi_blocco_hobby: {
    declaration: {
      name: "aggiungi_blocco_hobby",
      description: "Aggiunge un nuovo blocco (Checklist, Metrica, Inventario, Progetti, Libreria o Partite) a un hobby esistente.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          kind: { type: "string", enum: BLOCK_KINDS, description: "Tipo di blocco." },
          title: { type: "string", description: "Titolo del blocco." },
        },
        required: ["hobbyName", "kind", "title"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addBlock } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      addBlock(hobby.id, args.kind as HobbyBlockKind, String(args.title));
      return `Blocco "${args.title}" (${args.kind}) aggiunto a "${hobby.name}".`;
    },
  },

  elimina_blocco_hobby: {
    declaration: {
      name: "elimina_blocco_hobby",
      description: "Elimina un blocco di un hobby, cercando hobby e blocco per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          blockTitle: { type: "string", description: "Titolo (anche parziale) del blocco." },
        },
        required: ["hobbyName", "blockTitle"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeBlock } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const needle = String(args.blockTitle).trim().toLowerCase();
      const block = hobby.blocks.find((b) => b.title.trim().toLowerCase().includes(needle));
      if (!block) return `Non ho trovato nessun blocco con titolo simile a "${args.blockTitle}" in "${hobby.name}".`;
      removeBlock(hobby.id, block.id);
      return `Blocco "${block.title}" eliminato da "${hobby.name}".`;
    },
  },

  registra_metrica_hobby: {
    declaration: {
      name: "registra_metrica_hobby",
      description: "Registra un nuovo valore in un blocco Metrica di un hobby (es. km percorsi, pagine lette).",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          blockTitle: { type: "string", description: "Titolo del blocco Metrica, se l'hobby ne ha più di uno." },
          value: { type: "number", description: "Valore da registrare." },
          note: { type: "string", description: "Nota facoltativa." },
        },
        required: ["hobbyName", "value"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addMetricEntry } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "metrica", args.blockTitle ? String(args.blockTitle) : undefined);
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Metrica.`;
      addMetricEntry(hobby.id, block.id, { date: new Date().toISOString().slice(0, 10), value: Number(args.value), note: args.note ? String(args.note) : undefined });
      return `Registrato ${args.value} nel blocco "${block.title}" di ${hobby.name}.`;
    },
  },

  aggiungi_voce_checklist_hobby: {
    declaration: {
      name: "aggiungi_voce_checklist_hobby",
      description: "Aggiunge una voce a un blocco Checklist di un hobby.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          title: { type: "string", description: "Titolo della voce." },
        },
        required: ["hobbyName", "title"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addChecklistItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "checklist");
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Checklist.`;
      addChecklistItem(hobby.id, block.id, { title: String(args.title), status: "da-fare", photoKeys: [], personIds: [], tags: [] });
      return `Voce "${args.title}" aggiunta alla checklist di "${hobby.name}".`;
    },
  },

  aggiorna_stato_checklist_hobby: {
    declaration: {
      name: "aggiorna_stato_checklist_hobby",
      description: "Aggiorna lo stato di una voce checklist di un hobby, cercandola per titolo.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          itemTitle: { type: "string", description: "Titolo (anche parziale) della voce." },
          status: { type: "string", enum: CHECKLIST_STATUSES, description: "Nuovo stato." },
        },
        required: ["hobbyName", "itemTitle", "status"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, updateChecklistItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "checklist");
      if (!block || block.kind !== "checklist") return `L'hobby "${hobby.name}" non ha nessun blocco Checklist.`;
      const needle = String(args.itemTitle).trim().toLowerCase();
      const item = block.items.find((i) => i.title.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessuna voce simile a "${args.itemTitle}".`;
      updateChecklistItem(hobby.id, block.id, item.id, { status: args.status as ChecklistStatus });
      return `Voce "${item.title}" impostata su "${args.status}".`;
    },
  },

  rimuovi_voce_checklist_hobby: {
    declaration: {
      name: "rimuovi_voce_checklist_hobby",
      description: "Rimuove una voce da un blocco Checklist, cercandola per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          itemTitle: { type: "string", description: "Titolo (anche parziale) della voce." },
        },
        required: ["hobbyName", "itemTitle"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeChecklistItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "checklist");
      if (!block || block.kind !== "checklist") return `L'hobby "${hobby.name}" non ha nessun blocco Checklist.`;
      const needle = String(args.itemTitle).trim().toLowerCase();
      const item = block.items.find((i) => i.title.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessuna voce simile a "${args.itemTitle}".`;
      removeChecklistItem(hobby.id, block.id, item.id);
      return `Voce "${item.title}" rimossa.`;
    },
  },

  aggiungi_oggetto_inventario_hobby: {
    declaration: {
      name: "aggiungi_oggetto_inventario_hobby",
      description: "Aggiunge un oggetto a un blocco Inventario di un hobby (es. collezione).",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          name: { type: "string", description: "Nome dell'oggetto." },
          quantity: { type: "number", description: "Quantità posseduta. Default 1." },
        },
        required: ["hobbyName", "name"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addInventoryItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "inventario");
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Inventario.`;
      addInventoryItem(hobby.id, block.id, {
        name: String(args.name),
        photoKeys: [],
        quantity: args.quantity !== undefined ? Number(args.quantity) : 1,
        forTrade: false,
        details: [],
      });
      return `Oggetto "${args.name}" aggiunto all'inventario di "${hobby.name}".`;
    },
  },

  rimuovi_oggetto_inventario_hobby: {
    declaration: {
      name: "rimuovi_oggetto_inventario_hobby",
      description: "Rimuove un oggetto da un blocco Inventario, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          itemName: { type: "string", description: "Nome (anche parziale) dell'oggetto." },
        },
        required: ["hobbyName", "itemName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeInventoryItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "inventario");
      if (!block || block.kind !== "inventario") return `L'hobby "${hobby.name}" non ha nessun blocco Inventario.`;
      const needle = String(args.itemName).trim().toLowerCase();
      const item = block.items.find((i) => i.name.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessun oggetto simile a "${args.itemName}".`;
      removeInventoryItem(hobby.id, block.id, item.id);
      return `Oggetto "${item.name}" rimosso.`;
    },
  },

  aggiungi_progetto_hobby: {
    declaration: {
      name: "aggiungi_progetto_hobby",
      description: "Aggiunge un progetto a un blocco Progetti di un hobby.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          name: { type: "string", description: "Nome del progetto." },
          status: { type: "string", enum: PROJECT_STATUSES, description: "Stato iniziale. Default 'idea'." },
        },
        required: ["hobbyName", "name"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addProject } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "progetti");
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Progetti.`;
      addProject(hobby.id, block.id, { name: String(args.name), photoKeys: [], status: (args.status as ProjectStatus) ?? "idea", materials: [] });
      return `Progetto "${args.name}" aggiunto a "${hobby.name}".`;
    },
  },

  aggiorna_stato_progetto_hobby: {
    declaration: {
      name: "aggiorna_stato_progetto_hobby",
      description: "Aggiorna lo stato di un progetto, cercandolo per nome.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          projectName: { type: "string", description: "Nome (anche parziale) del progetto." },
          status: { type: "string", enum: PROJECT_STATUSES, description: "Nuovo stato." },
        },
        required: ["hobbyName", "projectName", "status"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, updateProject } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "progetti");
      if (!block || block.kind !== "progetti") return `L'hobby "${hobby.name}" non ha nessun blocco Progetti.`;
      const needle = String(args.projectName).trim().toLowerCase();
      const project = block.projects.find((p) => p.name.trim().toLowerCase().includes(needle));
      if (!project) return `Non ho trovato nessun progetto simile a "${args.projectName}".`;
      updateProject(hobby.id, block.id, project.id, { status: args.status as ProjectStatus });
      return `Progetto "${project.name}" impostato su "${args.status}".`;
    },
  },

  rimuovi_progetto_hobby: {
    declaration: {
      name: "rimuovi_progetto_hobby",
      description: "Rimuove un progetto, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          projectName: { type: "string", description: "Nome (anche parziale) del progetto." },
        },
        required: ["hobbyName", "projectName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeProject } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "progetti");
      if (!block || block.kind !== "progetti") return `L'hobby "${hobby.name}" non ha nessun blocco Progetti.`;
      const needle = String(args.projectName).trim().toLowerCase();
      const project = block.projects.find((p) => p.name.trim().toLowerCase().includes(needle));
      if (!project) return `Non ho trovato nessun progetto simile a "${args.projectName}".`;
      removeProject(hobby.id, block.id, project.id);
      return `Progetto "${project.name}" rimosso.`;
    },
  },

  aggiungi_libreria_hobby: {
    declaration: {
      name: "aggiungi_libreria_hobby",
      description: "Aggiunge un elemento (libro, film, gioco...) a un blocco Libreria di un hobby.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          title: { type: "string", description: "Titolo dell'elemento." },
          status: { type: "string", enum: LIBRARY_STATUSES, description: "Stato iniziale. Default 'da-provare'." },
        },
        required: ["hobbyName", "title"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addLibraryItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "libreria");
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Libreria.`;
      addLibraryItem(hobby.id, block.id, { title: String(args.title), status: (args.status as LibraryStatus) ?? "da-provare", rewatchCount: 0 });
      return `"${args.title}" aggiunto alla libreria di "${hobby.name}".`;
    },
  },

  aggiorna_stato_libreria_hobby: {
    declaration: {
      name: "aggiorna_stato_libreria_hobby",
      description: "Aggiorna stato e/o valutazione di un elemento della Libreria, cercandolo per titolo.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          itemTitle: { type: "string", description: "Titolo (anche parziale) dell'elemento." },
          status: { type: "string", enum: LIBRARY_STATUSES, description: "Nuovo stato." },
          rating: { type: "number", description: "Valutazione da 1 a 5." },
        },
        required: ["hobbyName", "itemTitle"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, updateLibraryItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "libreria");
      if (!block || block.kind !== "libreria") return `L'hobby "${hobby.name}" non ha nessun blocco Libreria.`;
      const needle = String(args.itemTitle).trim().toLowerCase();
      const item = block.items.find((i) => i.title.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessun elemento simile a "${args.itemTitle}".`;
      const patch: Partial<LibraryItem> = {};
      if (args.status) patch.status = args.status as LibraryStatus;
      if (args.rating !== undefined) patch.rating = Number(args.rating);
      updateLibraryItem(hobby.id, block.id, item.id, patch);
      return `"${item.title}" aggiornato.`;
    },
  },

  rimuovi_libreria_hobby: {
    declaration: {
      name: "rimuovi_libreria_hobby",
      description: "Rimuove un elemento dalla Libreria, cercandolo per titolo. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          itemTitle: { type: "string", description: "Titolo (anche parziale) dell'elemento." },
        },
        required: ["hobbyName", "itemTitle"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeLibraryItem } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "libreria");
      if (!block || block.kind !== "libreria") return `L'hobby "${hobby.name}" non ha nessun blocco Libreria.`;
      const needle = String(args.itemTitle).trim().toLowerCase();
      const item = block.items.find((i) => i.title.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessun elemento simile a "${args.itemTitle}".`;
      removeLibraryItem(hobby.id, block.id, item.id);
      return `"${item.title}" rimosso.`;
    },
  },

  registra_partita_hobby: {
    declaration: {
      name: "registra_partita_hobby",
      description: "Registra una partita/incontro in un blocco Partite di un hobby.",
      parameters: {
        type: "object",
        properties: {
          hobbyName: { type: "string", description: "Nome dell'hobby." },
          opponent: { type: "string", description: "Nome dell'avversario/squadra avversaria." },
          result: { type: "string", enum: MATCH_RESULTS, description: "Esito della partita." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
          score: { type: "string", description: "Punteggio, se rilevante." },
        },
        required: ["hobbyName", "result"],
      },
    },
    execute: (args, ctx) => {
      const { hobbies, addMatch } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "partite");
      if (!block) return `L'hobby "${hobby.name}" non ha nessun blocco Partite.`;
      addMatch(hobby.id, block.id, {
        opponent: args.opponent ? String(args.opponent) : undefined,
        date: args.date ? String(args.date) : new Date().toISOString().slice(0, 10),
        result: args.result as MatchResult,
        score: args.score ? String(args.score) : undefined,
      });
      return `Partita registrata in "${hobby.name}" (${args.result}).`;
    },
  },

  rimuovi_partita_hobby: {
    declaration: {
      name: "rimuovi_partita_hobby",
      description: "Rimuove l'ultima partita registrata in un blocco Partite di un hobby. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { hobbyName: { type: "string", description: "Nome dell'hobby." } },
        required: ["hobbyName"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { hobbies, removeMatch } = hobbyCtx(ctx);
      const hobby = findHobbyByName(hobbies, String(args.hobbyName));
      if (!hobby) return `Non ho trovato nessun hobby con nome simile a "${args.hobbyName}".`;
      const block = findBlock(hobby, "partite");
      if (!block || block.kind !== "partite") return `L'hobby "${hobby.name}" non ha nessun blocco Partite.`;
      const last = [...block.matches].sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return `Nessuna partita registrata in "${hobby.name}".`;
      removeMatch(hobby.id, block.id, last.id);
      return `Ultima partita di "${hobby.name}" rimossa.`;
    },
  },

  elenca_hobby: {
    declaration: {
      name: "elenca_hobby",
      description: "Elenca gli hobby registrati in Vitae.",
      parameters: { type: "object", properties: {} },
    },
    execute: (_args, ctx) => {
      const { hobbies } = hobbyCtx(ctx);
      if (hobbies.length === 0) return "Nessun hobby registrato.";
      return hobbies.map((h) => h.name).join(", ");
    },
  },
};
