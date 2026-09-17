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
        type: "object",
        properties: {
          text: { type: "string", description: "Testo della voce di diario." },
          date: { type: "string", description: "Data YYYY-MM-DD. Se omessa, usa oggi." },
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
        type: "object",
        properties: {
          text: { type: "string", description: "Testo (anche parziale) attuale della voce da trovare." },
          newText: { type: "string", description: "Nuovo testo della voce." },
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
        type: "object",
        properties: { text: { type: "string", description: "Testo (anche parziale) della voce da eliminare." } },
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
};
