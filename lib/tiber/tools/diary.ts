import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { DiaryEntry } from "@/lib/diary-types";
import { todayIso } from "@/lib/date-format";

interface DiaryCtx {
  entries: DiaryEntry[];
  addEntry: (input: Omit<DiaryEntry, "id" | "createdAt">) => DiaryEntry;
  updateEntry: (id: string, patch: Partial<Omit<DiaryEntry, "id" | "createdAt">>) => void;
  removeEntry: (id: string) => void;
}

function diaryCtx(ctx: TiberExecutionContext): DiaryCtx {
  return ctxField<DiaryCtx>(ctx, "diary");
}

export const diaryTools: Record<string, TiberToolDefinition> = {
  scrivi_diario: {
    declaration: {
      name: "scrivi_diario",
      description: "Aggiunge una nuova voce al Diario personale.",
      parameters: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "Testo della voce di diario." },
          date: { type: "STRING", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
        },
        required: ["text"],
      },
    },
    execute: (args, ctx) => {
      const { addEntry } = diaryCtx(ctx);
      addEntry({
        date: args.date ? String(args.date) : todayIso(),
        time: new Date().toTimeString().slice(0, 5),
        text: String(args.text),
        media: [],
        links: [],
      });
      return "Voce di diario aggiunta.";
    },
  },

  modifica_voce_diario: {
    declaration: {
      name: "modifica_voce_diario",
      description: "Sostituisce il testo di una voce di diario esistente, cercandola per contenuto attuale.",
      parameters: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "Testo (anche parziale) attuale della voce da trovare." },
          newText: { type: "STRING", description: "Nuovo testo della voce." },
        },
        required: ["text", "newText"],
      },
    },
    execute: (args, ctx) => {
      const { entries, updateEntry } = diaryCtx(ctx);
      const needle = String(args.text).trim().toLowerCase();
      const found = entries.find((e) => e.text.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessuna voce di diario simile a "${args.text}".`;
      updateEntry(found.id, { text: String(args.newText) });
      return "Voce di diario aggiornata.";
    },
  },

  elimina_voce_diario: {
    declaration: {
      name: "elimina_voce_diario",
      description: "Elimina una voce di diario cercandola per contenuto testuale. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { text: { type: "STRING", description: "Testo (anche parziale) della voce da eliminare." } },
        required: ["text"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { entries, removeEntry } = diaryCtx(ctx);
      const needle = String(args.text).trim().toLowerCase();
      const found = entries.find((e) => e.text.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessuna voce di diario simile a "${args.text}".`;
      removeEntry(found.id);
      return "Voce di diario eliminata.";
    },
  },

  /**
   * Corretto secondo le istruzioni: questo modulo aveva solo azioni di scrittura (scrivi/
   * modifica/elimina) — nessun modo per Tiber di rileggere cosa contenesse davvero il
   * diario, quindi "cosa ho scritto ieri" non aveva alcun tool a cui appoggiarsi.
   */
  leggi_diario: {
    declaration: {
      name: "leggi_diario",
      description:
        "Legge le voci del Diario personale — le più recenti di default, oppure filtrate per data esatta e/o per una parola chiave nel testo. Usalo per rispondere a domande su cosa è stato scritto nel diario, prima di dire che non puoi saperlo.",
      parameters: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING", description: "Data esatta YYYY-MM-DD da cercare, se richiesta." },
          query: { type: "STRING", description: "Parola o frase da cercare nel testo delle voci, se richiesta." },
          limit: { type: "NUMBER", description: "Quante voci restituire al massimo. Default 5." },
        },
      },
    },
    execute: (args, ctx) => {
      const { entries } = diaryCtx(ctx);
      let filtered = [...entries].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      if (args.date) filtered = filtered.filter((e) => e.date === String(args.date));
      if (args.query) {
        const needle = String(args.query).trim().toLowerCase();
        filtered = filtered.filter((e) => e.text.trim().toLowerCase().includes(needle));
      }
      if (filtered.length === 0) return "Nessuna voce di diario trovata con questi criteri.";
      const limit = args.limit !== undefined ? Number(args.limit) : 5;
      return filtered.slice(0, limit).map((e) => `${e.date} ${e.time}: ${e.text}`).join("\n");
    },
  },
};
