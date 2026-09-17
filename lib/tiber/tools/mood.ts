import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { MoodDefinition } from "@/lib/mood-catalog";

interface MoodModuleCtx {
  allMoods: MoodDefinition[];
  setMoodManually: (moodId: string) => void;
  clearMood: () => void;
  addCustomMood: (label: string) => string;
  removeCustomMood: (id: string) => void;
}

interface NeedsModuleCtx {
  needs: { id: string; label: string }[];
  addNeed: (label: string, moodId: string) => void;
  cancelNeed: (id: string) => void;
  fulfillNeed: (id: string) => boolean;
}

interface MoodCtx {
  mood: MoodModuleCtx;
  needs: NeedsModuleCtx;
}

function moodCtx(ctx: TiberExecutionContext): MoodCtx {
  return ctxField<MoodCtx>(ctx, "moodModule");
}

function findMoodByLabel(moods: MoodDefinition[], label: string): MoodDefinition | undefined {
  const needle = label.trim().toLowerCase();
  return (
    moods.find((m) => m.label.trim().toLowerCase() === needle) ??
    moods.find((m) => m.label.trim().toLowerCase().includes(needle))
  );
}

export const moodTools: Record<string, TiberToolDefinition> = {
  imposta_stato_animo: {
    declaration: {
      name: "imposta_stato_animo",
      description: "Imposta manualmente lo stato d'animo attivo dell'utente, cercandolo per nome (es. 'Felice', 'Stanco').",
      parameters: {
        type: "object",
        properties: { moodLabel: { type: "string", description: "Nome dello stato d'animo." } },
        required: ["moodLabel"],
      },
    },
    execute: (args, ctx) => {
      const { mood } = moodCtx(ctx);
      const found = findMoodByLabel(mood.allMoods, String(args.moodLabel));
      if (!found) return `Non ho trovato nessuno stato d'animo simile a "${args.moodLabel}".`;
      mood.setMoodManually(found.id);
      return `Stato d'animo impostato su "${found.label}".`;
    },
  },

  azzera_stato_animo: {
    declaration: {
      name: "azzera_stato_animo",
      description: "Torna allo stato d'animo neutro, cancellando quello attivo.",
      parameters: { type: "object", properties: {} },
    },
    execute: (_args, ctx) => {
      const { mood } = moodCtx(ctx);
      mood.clearMood();
      return "Stato d'animo azzerato.";
    },
  },

  crea_stato_animo_personalizzato: {
    declaration: {
      name: "crea_stato_animo_personalizzato",
      description: "Crea un nuovo stato d'animo personalizzato.",
      parameters: {
        type: "object",
        properties: { label: { type: "string", description: "Nome del nuovo stato d'animo." } },
        required: ["label"],
      },
    },
    execute: (args, ctx) => {
      const { mood } = moodCtx(ctx);
      mood.addCustomMood(String(args.label));
      return `Stato d'animo "${args.label}" creato.`;
    },
  },

  elimina_stato_animo_personalizzato: {
    declaration: {
      name: "elimina_stato_animo_personalizzato",
      description: "Elimina uno stato d'animo personalizzato (non quelli predefiniti), cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { moodLabel: { type: "string", description: "Nome (anche parziale) dello stato d'animo." } },
        required: ["moodLabel"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { mood } = moodCtx(ctx);
      const found = findMoodByLabel(mood.allMoods, String(args.moodLabel));
      if (!found) return `Non ho trovato nessuno stato d'animo simile a "${args.moodLabel}".`;
      if (found.builtIn) return `"${found.label}" è uno stato d'animo predefinito e non può essere eliminato.`;
      mood.removeCustomMood(found.id);
      return `Stato d'animo "${found.label}" eliminato.`;
    },
  },

  aggiungi_bisogno_settimanale: {
    declaration: {
      name: "aggiungi_bisogno_settimanale",
      description: "Aggiunge un nuovo bisogno settimanale (dura 7 giorni) con uno stato d'animo associato a quando verrà esaudito.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string", description: "Descrizione del bisogno (es. 'Uscire con amici')." },
          moodLabel: { type: "string", description: "Stato d'animo da provare quando esaudito." },
        },
        required: ["label", "moodLabel"],
      },
    },
    execute: (args, ctx) => {
      const { mood, needs } = moodCtx(ctx);
      const found = findMoodByLabel(mood.allMoods, String(args.moodLabel));
      const moodId = found?.id ?? "appagato";
      needs.addNeed(String(args.label), moodId);
      return `Bisogno "${args.label}" aggiunto.`;
    },
  },

  esaudisci_bisogno: {
    declaration: {
      name: "esaudisci_bisogno",
      description: "Segna come esaudito un bisogno settimanale attivo, cercandolo per descrizione.",
      parameters: {
        type: "object",
        properties: { label: { type: "string", description: "Descrizione (anche parziale) del bisogno." } },
        required: ["label"],
      },
    },
    execute: (args, ctx) => {
      const { needs } = moodCtx(ctx);
      const needle = String(args.label).trim().toLowerCase();
      const found = needs.needs.find((n) => n.label.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessun bisogno attivo simile a "${args.label}".`;
      needs.fulfillNeed(found.id);
      return `Bisogno "${found.label}" segnato come esaudito.`;
    },
  },

  annulla_bisogno_settimanale: {
    declaration: {
      name: "annulla_bisogno_settimanale",
      description: "Annulla un bisogno settimanale attivo senza segnarlo come esaudito, cercandolo per descrizione.",
      parameters: {
        type: "object",
        properties: { label: { type: "string", description: "Descrizione (anche parziale) del bisogno." } },
        required: ["label"],
      },
    },
    execute: (args, ctx) => {
      const { needs } = moodCtx(ctx);
      const needle = String(args.label).trim().toLowerCase();
      const found = needs.needs.find((n) => n.label.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessun bisogno attivo simile a "${args.label}".`;
      needs.cancelNeed(found.id);
      return `Bisogno "${found.label}" annullato.`;
    },
  },
};
