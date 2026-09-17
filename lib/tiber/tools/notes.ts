import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { NoteEntry, NoteList } from "@/lib/notes-types";

interface NotesCtx {
  entries: NoteEntry[];
  addList: (title: string) => NoteList;
  addNote: (title: string) => NoteEntry;
  renameEntry: (id: string, title: string) => void;
  removeEntry: (id: string) => void;
  updateNoteBody: (id: string, body: string) => void;
  addListItem: (listId: string, text: string) => void;
  removeListItem: (listId: string, itemId: string) => void;
  updateListItem: (listId: string, itemId: string, patch: { done?: boolean; text?: string }) => void;
  togglePinned: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
}

function notesCtx(ctx: TiberExecutionContext): NotesCtx {
  return ctxField<NotesCtx>(ctx, "notes");
}

function findListByTitle(entries: NoteEntry[], title: string): NoteList | undefined {
  const needle = title.trim().toLowerCase();
  const lists = entries.filter((e): e is NoteList => e.kind === "list");
  return (
    lists.find((l) => l.title.trim().toLowerCase() === needle) ??
    lists.find((l) => l.title.trim().toLowerCase().includes(needle))
  );
}

function findEntryByTitle(entries: NoteEntry[], title: string): NoteEntry | undefined {
  const needle = title.trim().toLowerCase();
  return (
    entries.find((e) => e.title.trim().toLowerCase() === needle) ??
    entries.find((e) => e.title.trim().toLowerCase().includes(needle))
  );
}

export const notesTools: Record<string, TiberToolDefinition> = {
  aggiungi_a_lista: {
    declaration: {
      name: "aggiungi_a_lista",
      description:
        "Aggiunge una voce a una lista esistente in 'Liste e note' (es. la lista della spesa), cercando la lista per titolo. Se la lista non esiste, la crea.",
      parameters: {
        type: "OBJECT",
        properties: {
          listTitle: { type: "STRING", description: "Titolo della lista (es. 'Lista della spesa')." },
          item: { type: "STRING", description: "Testo della voce da aggiungere." },
        },
        required: ["listTitle", "item"],
      },
    },
    execute: (args, ctx) => {
      const { entries, addList, addListItem } = notesCtx(ctx);
      let list = findListByTitle(entries, String(args.listTitle));
      if (!list) list = addList(String(args.listTitle));
      addListItem(list.id, String(args.item));
      return `Aggiunto "${args.item}" alla lista "${list.title}".`;
    },
  },

  segna_voce_lista: {
    declaration: {
      name: "segna_voce_lista",
      description: "Segna come fatta (o da fare) una voce di una lista, cercando lista e voce per testo.",
      parameters: {
        type: "OBJECT",
        properties: {
          listTitle: { type: "STRING", description: "Titolo (anche parziale) della lista." },
          item: { type: "STRING", description: "Testo (anche parziale) della voce." },
          done: { type: "BOOLEAN", description: "true per segnarla fatta, false per riaprirla." },
        },
        required: ["listTitle", "item", "done"],
      },
    },
    execute: (args, ctx) => {
      const { entries, updateListItem } = notesCtx(ctx);
      const list = findListByTitle(entries, String(args.listTitle));
      if (!list) return `Non ho trovato nessuna lista con titolo simile a "${args.listTitle}".`;
      const needle = String(args.item).trim().toLowerCase();
      const item = list.items.find((i) => i.text.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessuna voce simile a "${args.item}" nella lista "${list.title}".`;
      updateListItem(list.id, item.id, { done: Boolean(args.done) });
      return `Voce "${item.text}" ${args.done ? "segnata come fatta" : "riaperta"}.`;
    },
  },

  rimuovi_voce_lista: {
    declaration: {
      name: "rimuovi_voce_lista",
      description: "Rimuove una voce da una lista, cercando lista e voce per testo. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: {
          listTitle: { type: "STRING", description: "Titolo (anche parziale) della lista." },
          item: { type: "STRING", description: "Testo (anche parziale) della voce da rimuovere." },
        },
        required: ["listTitle", "item"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { entries, removeListItem } = notesCtx(ctx);
      const list = findListByTitle(entries, String(args.listTitle));
      if (!list) return `Non ho trovato nessuna lista con titolo simile a "${args.listTitle}".`;
      const needle = String(args.item).trim().toLowerCase();
      const item = list.items.find((i) => i.text.trim().toLowerCase().includes(needle));
      if (!item) return `Non ho trovato nessuna voce simile a "${args.item}" nella lista "${list.title}".`;
      removeListItem(list.id, item.id);
      return `Voce "${item.text}" rimossa dalla lista "${list.title}".`;
    },
  },

  crea_nota: {
    declaration: {
      name: "crea_nota",
      description: "Crea una nuova lista o nota testuale vuota in 'Liste e note'.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo della nuova lista/nota." },
          kind: { type: "STRING", enum: ["list", "note"], description: "'list' per una lista spuntabile, 'note' per testo libero." },
        },
        required: ["title", "kind"],
      },
    },
    execute: (args, ctx) => {
      const { addList, addNote } = notesCtx(ctx);
      const created = args.kind === "note" ? addNote(String(args.title)) : addList(String(args.title));
      return `${args.kind === "note" ? "Nota" : "Lista"} "${created.title}" creata.`;
    },
  },

  rinomina_nota: {
    declaration: {
      name: "rinomina_nota",
      description: "Rinomina una lista o nota esistente, cercandola per titolo attuale.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo (anche parziale) attuale." },
          newTitle: { type: "STRING", description: "Nuovo titolo." },
        },
        required: ["title", "newTitle"],
      },
    },
    execute: (args, ctx) => {
      const { entries, renameEntry } = notesCtx(ctx);
      const found = findEntryByTitle(entries, String(args.title));
      if (!found) return `Non ho trovato nessuna lista/nota con titolo simile a "${args.title}".`;
      renameEntry(found.id, String(args.newTitle));
      return `Rinominata in "${args.newTitle}".`;
    },
  },

  scrivi_nota_testuale: {
    declaration: {
      name: "scrivi_nota_testuale",
      description: "Sostituisce il contenuto di una nota testuale esistente (non una lista), cercandola per titolo.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo (anche parziale) della nota." },
          body: { type: "STRING", description: "Nuovo contenuto della nota." },
        },
        required: ["title", "body"],
      },
    },
    execute: (args, ctx) => {
      const { entries, updateNoteBody } = notesCtx(ctx);
      const found = entries.find((e) => e.kind === "note" && e.title.trim().toLowerCase().includes(String(args.title).trim().toLowerCase()));
      if (!found) return `Non ho trovato nessuna nota testuale con titolo simile a "${args.title}".`;
      updateNoteBody(found.id, String(args.body));
      return `Contenuto di "${found.title}" aggiornato.`;
    },
  },

  fissa_nota: {
    declaration: {
      name: "fissa_nota",
      description: "Fissa (o toglie dal fisso) una lista o nota in cima all'elenco, cercandola per titolo.",
      parameters: {
        type: "OBJECT",
        properties: { title: { type: "STRING", description: "Titolo (anche parziale) della lista/nota." } },
        required: ["title"],
      },
    },
    execute: (args, ctx) => {
      const { entries, togglePinned } = notesCtx(ctx);
      const found = findEntryByTitle(entries, String(args.title));
      if (!found) return `Non ho trovato nessuna lista/nota con titolo simile a "${args.title}".`;
      togglePinned(found.id);
      return `"${found.title}" ${found.pinned ? "non è più fissata" : "fissata in cima"}.`;
    },
  },

  aggiungi_tag_nota: {
    declaration: {
      name: "aggiungi_tag_nota",
      description: "Aggiunge un tag a una lista o nota, cercandola per titolo.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo (anche parziale) della lista/nota." },
          tag: { type: "STRING", description: "Tag da aggiungere." },
        },
        required: ["title", "tag"],
      },
    },
    execute: (args, ctx) => {
      const { entries, addTag } = notesCtx(ctx);
      const found = findEntryByTitle(entries, String(args.title));
      if (!found) return `Non ho trovato nessuna lista/nota con titolo simile a "${args.title}".`;
      addTag(found.id, String(args.tag));
      return `Tag "${args.tag}" aggiunto a "${found.title}".`;
    },
  },

  elimina_nota: {
    declaration: {
      name: "elimina_nota",
      description: "Elimina definitivamente una lista o nota, cercandola per titolo. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { title: { type: "STRING", description: "Titolo (anche parziale) della lista/nota da eliminare." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { entries, removeEntry } = notesCtx(ctx);
      const found = findEntryByTitle(entries, String(args.title));
      if (!found) return `Non ho trovato nessuna lista/nota con titolo simile a "${args.title}".`;
      removeEntry(found.id);
      return `"${found.title}" eliminata.`;
    },
  },

  /**
   * Corretto secondo le istruzioni: questo modulo aveva solo azioni di scrittura (aggiungi/
   * segna/rimuovi/crea/rinomina/scrivi/fissa/elimina) — nessun tool restituiva mai il
   * contenuto vero di una lista o nota, quindi "cosa c'è nella lista della spesa" non aveva
   * alcun tool a cui appoggiarsi.
   */
  elenca_note: {
    declaration: {
      name: "elenca_note",
      description: "Elenca le liste e le note testuali salvate in 'Liste e note', con tipo e se sono fissate in cima.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { entries } = notesCtx(ctx);
      if (entries.length === 0) return "Nessuna lista o nota salvata.";
      return entries.map((e) => `${e.title} (${e.kind === "list" ? "lista" : "nota"}${e.pinned ? ", fissata" : ""})`).join(", ");
    },
  },

  leggi_nota: {
    declaration: {
      name: "leggi_nota",
      description:
        "Legge il contenuto vero di una lista o nota — le voci di una lista (con stato fatto/da fare) oppure il testo di una nota, cercandola per titolo. Usalo per rispondere a domande su COSA contiene una lista o nota specifica, prima di dire che non puoi saperlo.",
      parameters: {
        type: "OBJECT",
        properties: { title: { type: "STRING", description: "Titolo (anche parziale) della lista/nota." } },
        required: ["title"],
      },
    },
    execute: (args, ctx) => {
      const { entries } = notesCtx(ctx);
      const found = findEntryByTitle(entries, String(args.title));
      if (!found) return `Non ho trovato nessuna lista/nota con titolo simile a "${args.title}".`;
      if (found.kind === "list") {
        if (found.items.length === 0) return `"${found.title}" è una lista vuota.`;
        return `"${found.title}": ${found.items.map((i) => `${i.text} (${i.done ? "fatto" : "da fare"})`).join(", ")}`;
      }
      return found.body.trim() ? `"${found.title}": ${found.body}` : `"${found.title}" è vuota.`;
    },
  },
};
