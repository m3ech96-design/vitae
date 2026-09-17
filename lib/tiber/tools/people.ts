import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Person, PersonKind, ANIMAL_KINDS } from "@/lib/types";
import { applyInteraction } from "@/lib/relationship";

interface PeopleCtx {
  people: Person[];
  addPerson: (person: { firstName: string; lastName: string; kind: PersonKind; livesAtHome: boolean }) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;
}

function peopleCtx(ctx: TiberExecutionContext): PeopleCtx {
  return ctxField<PeopleCtx>(ctx, "people");
}

const PERSON_KINDS: PersonKind[] = ["uomo", "donna", "bambino", "bambina", "cane", "gatto"];

function findPersonByName(people: Person[], name: string, humansOnly = false): Person | undefined {
  const needle = name.trim().toLowerCase();
  const pool = humansOnly ? people.filter((p) => !ANIMAL_KINDS.includes(p.kind)) : people;
  return (
    pool.find((p) => p.firstName.trim().toLowerCase() === needle) ??
    pool.find((p) => p.firstName.trim().toLowerCase().includes(needle))
  );
}

export const peopleTools: Record<string, TiberToolDefinition> = {
  crea_persona: {
    declaration: {
      name: "crea_persona",
      description: "Aggiunge una nuova persona o animale a Rapporti/Mondo.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "Nome." },
          lastName: { type: "string", description: "Cognome (lascia vuoto per un animale)." },
          kind: { type: "string", enum: PERSON_KINDS, description: "Tipo: uomo, donna, bambino, bambina, cane o gatto." },
          livesAtHome: { type: "boolean", description: "true se vive nello stesso nucleo domestico dell'utente." },
        },
        required: ["firstName", "kind"],
      },
    },
    execute: (args, ctx) => {
      const { addPerson } = peopleCtx(ctx);
      addPerson({
        firstName: String(args.firstName),
        lastName: args.lastName ? String(args.lastName) : "",
        kind: args.kind as PersonKind,
        livesAtHome: Boolean(args.livesAtHome),
      });
      return `${args.firstName} aggiunto/a a Rapporti.`;
    },
  },

  registra_interazione: {
    declaration: {
      name: "registra_interazione",
      description:
        "Registra un'interazione (positiva o negativa) con una persona in Rapporti, cercandola per nome — modifica il suo punteggio di relazione.",
      parameters: {
        type: "object",
        properties: {
          personName: { type: "string", description: "Nome della persona." },
          label: { type: "string", description: "Breve descrizione dell'interazione." },
          positive: { type: "boolean", description: "true se positiva, false se negativa." },
        },
        required: ["personName", "label", "positive"],
      },
    },
    execute: (args, ctx) => {
      const { people, updatePerson } = peopleCtx(ctx);
      const person = findPersonByName(people, String(args.personName), true);
      if (!person) return `Non ho trovato nessuna persona con nome simile a "${args.personName}".`;
      const isPartner = person.partnerPersonId !== undefined;
      const { patch, event } = applyInteraction(person, String(args.label), Boolean(args.positive), Boolean(isPartner));
      updatePerson(person.id, { ...patch, relationshipHistory: [...person.relationshipHistory, event] });
      return `Interazione ${args.positive ? "positiva" : "negativa"} registrata con ${person.firstName}.`;
    },
  },

  modifica_persona: {
    declaration: {
      name: "modifica_persona",
      description: "Modifica dati anagrafici di base di una persona o animale esistente, cercandola per nome.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome (anche parziale) attuale." },
          newFirstName: { type: "string", description: "Nuovo nome, se da cambiare." },
          newLastName: { type: "string", description: "Nuovo cognome, se da cambiare." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { people, updatePerson } = peopleCtx(ctx);
      const person = findPersonByName(people, String(args.name));
      if (!person) return `Non ho trovato nessuno con nome simile a "${args.name}".`;
      const patch: Partial<Person> = {};
      if (args.newFirstName) patch.firstName = String(args.newFirstName);
      if (args.newLastName) patch.lastName = String(args.newLastName);
      updatePerson(person.id, patch);
      return `Dati di ${person.firstName} aggiornati.`;
    },
  },

  elenca_persone: {
    declaration: {
      name: "elenca_persone",
      description: "Elenca le persone conosciute in Rapporti (esclusi gli animali), con punteggio relazione attuale.",
      parameters: { type: "object", properties: {} },
    },
    execute: (_args, ctx) => {
      const { people } = peopleCtx(ctx);
      const humans = people.filter((p) => !ANIMAL_KINDS.includes(p.kind));
      if (humans.length === 0) return "Nessuna persona registrata in Rapporti.";
      return humans.map((p) => `${p.firstName} ${p.lastName} (relazione: ${p.relationshipScore})`).join("; ");
    },
  },

  elimina_persona: {
    declaration: {
      name: "elimina_persona",
      description: "Elimina definitivamente una persona (o animale) da Rapporti, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nome (anche parziale) della persona o animale da eliminare." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { people, removePerson } = peopleCtx(ctx);
      const person = findPersonByName(people, String(args.name));
      if (!person) return `Non ho trovato nessuno con nome simile a "${args.name}".`;
      removePerson(person.id);
      return `${person.firstName} eliminato/a da Rapporti.`;
    },
  },
};
