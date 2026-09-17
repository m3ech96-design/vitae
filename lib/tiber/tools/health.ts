import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import {
  MedicalReport,
  MedicalAppointment,
  BloodTestPanel,
  Medication,
  MedicalCondition,
  Surgery,
  FamilyHistoryEntry,
  Allergy,
  Vaccination,
  MedicalContact,
  SymptomEntry,
  VitalEntry,
  VitalType,
} from "@/lib/medical-context";
import { todayIso } from "@/lib/date-format";

interface HealthCtx {
  reports: MedicalReport[];
  addReport: (r: Omit<MedicalReport, "id">) => void;
  removeReport: (id: string) => void;
  appointments: MedicalAppointment[];
  addAppointment: (a: Omit<MedicalAppointment, "id">) => void;
  removeAppointment: (id: string) => void;
  bloodTests: BloodTestPanel[];
  addBloodTest: (b: Omit<BloodTestPanel, "id">) => void;
  removeBloodTest: (id: string) => void;
  vitals: VitalEntry[];
  addVital: (v: Omit<VitalEntry, "id">) => void;
  removeVital: (id: string) => void;
  medications: Medication[];
  addMedication: (m: Omit<Medication, "id">) => void;
  removeMedication: (id: string) => void;
  conditions: MedicalCondition[];
  addCondition: (c: Omit<MedicalCondition, "id">) => void;
  removeCondition: (id: string) => void;
  surgeries: Surgery[];
  addSurgery: (s: Omit<Surgery, "id">) => void;
  removeSurgery: (id: string) => void;
  familyHistory: FamilyHistoryEntry[];
  addFamilyHistory: (f: Omit<FamilyHistoryEntry, "id">) => void;
  removeFamilyHistory: (id: string) => void;
  allergies: Allergy[];
  addAllergy: (a: Omit<Allergy, "id">) => void;
  removeAllergy: (id: string) => void;
  vaccinations: Vaccination[];
  addVaccination: (v: Omit<Vaccination, "id">) => void;
  removeVaccination: (id: string) => void;
  contacts: MedicalContact[];
  addContact: (c: Omit<MedicalContact, "id">) => void;
  removeContact: (id: string) => void;
  symptoms: SymptomEntry[];
  addSymptom: (s: Omit<SymptomEntry, "id">) => void;
  removeSymptom: (id: string) => void;
}

function healthCtx(ctx: TiberExecutionContext): HealthCtx {
  return ctxField<HealthCtx>(ctx, "health");
}

function byNameNeedle<T extends { name: string }>(items: T[], needle: string): T | undefined {
  const n = needle.trim().toLowerCase();
  return items.find((i) => i.name.trim().toLowerCase().includes(n));
}

export const healthTools: Record<string, TiberToolDefinition> = {
  aggiungi_referto_medico: {
    declaration: {
      name: "aggiungi_referto_medico",
      description: "Aggiunge un referto medico (analisi, visita, imaging) alla scheda Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo del referto." },
          type: { type: "STRING", description: "Tipo libero (es. 'Analisi', 'Visita', 'Imaging')." },
          date: { type: "STRING", description: "Data YYYY-MM-DD." },
          doctorOrLab: { type: "STRING", description: "Medico o laboratorio, se noto." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["title", "type", "date"],
      },
    },
    execute: (args, ctx) => {
      const { addReport } = healthCtx(ctx);
      addReport({
        title: String(args.title),
        type: String(args.type),
        date: String(args.date),
        doctorOrLab: args.doctorOrLab ? String(args.doctorOrLab) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
      });
      return `Referto "${args.title}" aggiunto.`;
    },
  },

  elimina_referto_medico: {
    declaration: {
      name: "elimina_referto_medico",
      description: "Elimina un referto medico, cercandolo per titolo. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { title: { type: "STRING", description: "Titolo (anche parziale) del referto." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { reports, removeReport } = healthCtx(ctx);
      const found = byNameNeedle(reports.map((r) => ({ ...r, name: r.title })), String(args.title));
      if (!found) return `Non ho trovato nessun referto con titolo simile a "${args.title}".`;
      removeReport(found.id);
      return `Referto "${found.title}" eliminato.`;
    },
  },

  aggiungi_appuntamento_medico: {
    declaration: {
      name: "aggiungi_appuntamento_medico",
      description: "Aggiunge un appuntamento medico (visita, controllo) in Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Titolo dell'appuntamento." },
          specialist: { type: "STRING", description: "Nome dello specialista, se noto." },
          date: { type: "STRING", description: "Data (e ora se rilevante) YYYY-MM-DD." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["title", "date"],
      },
    },
    execute: (args, ctx) => {
      const { addAppointment } = healthCtx(ctx);
      addAppointment({
        title: String(args.title),
        specialist: args.specialist ? String(args.specialist) : undefined,
        date: String(args.date),
        notes: args.notes ? String(args.notes) : undefined,
        completed: false,
      });
      return `Appuntamento "${args.title}" aggiunto per il ${args.date}.`;
    },
  },

  elimina_appuntamento_medico: {
    declaration: {
      name: "elimina_appuntamento_medico",
      description: "Elimina un appuntamento medico, cercandolo per titolo. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { title: { type: "STRING", description: "Titolo (anche parziale) dell'appuntamento." } },
        required: ["title"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { appointments, removeAppointment } = healthCtx(ctx);
      const needle = String(args.title).trim().toLowerCase();
      const found = appointments.find((a) => a.title.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessun appuntamento con titolo simile a "${args.title}".`;
      removeAppointment(found.id);
      return `Appuntamento "${found.title}" eliminato.`;
    },
  },

  aggiungi_esame_sangue: {
    declaration: {
      name: "aggiungi_esame_sangue",
      description: "Registra un pannello di esami del sangue con una data (i singoli valori si aggiungono poi dall'app).",
      parameters: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING", description: "Data dell'esame YYYY-MM-DD." },
          lab: { type: "STRING", description: "Laboratorio, se noto." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["date"],
      },
    },
    execute: (args, ctx) => {
      const { addBloodTest } = healthCtx(ctx);
      addBloodTest({ date: String(args.date), lab: args.lab ? String(args.lab) : undefined, values: [], notes: args.notes ? String(args.notes) : undefined });
      return `Pannello esami del sangue del ${args.date} registrato.`;
    },
  },

  elimina_esame_sangue: {
    declaration: {
      name: "elimina_esame_sangue",
      description: "Elimina un pannello di esami del sangue, cercandolo per data. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { date: { type: "STRING", description: "Data YYYY-MM-DD del pannello da eliminare." } },
        required: ["date"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { bloodTests, removeBloodTest } = healthCtx(ctx);
      const found = bloodTests.find((b) => b.date === String(args.date));
      if (!found) return `Non ho trovato nessun pannello esami del ${args.date}.`;
      removeBloodTest(found.id);
      return `Pannello esami del ${args.date} eliminato.`;
    },
  },

  registra_farmaco: {
    declaration: {
      name: "registra_farmaco",
      description: "Aggiunge un farmaco in corso alla scheda Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome del farmaco." },
          dosage: { type: "STRING", description: "Dosaggio (es. '500mg')." },
          times: { type: "ARRAY", items: { type: "STRING" }, description: "Orari di assunzione, formato HH:MM." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addMedication } = healthCtx(ctx);
      addMedication({
        name: String(args.name),
        dosage: args.dosage ? String(args.dosage) : undefined,
        times: Array.isArray(args.times) ? (args.times as string[]) : [],
        startDate: todayIso(),
        notes: args.notes ? String(args.notes) : undefined,
      });
      return `Farmaco "${args.name}" registrato.`;
    },
  },

  elimina_farmaco: {
    declaration: {
      name: "elimina_farmaco",
      description: "Rimuove un farmaco dalla lista, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del farmaco." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { medications, removeMedication } = healthCtx(ctx);
      const found = byNameNeedle(medications, String(args.name));
      if (!found) return `Non ho trovato nessun farmaco con nome simile a "${args.name}".`;
      removeMedication(found.id);
      return `Farmaco "${found.name}" rimosso.`;
    },
  },

  aggiungi_condizione_medica: {
    declaration: {
      name: "aggiungi_condizione_medica",
      description: "Aggiunge una condizione medica cronica o diagnosi alla scheda Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome della condizione." },
          since: { type: "STRING", description: "Da quando, se noto (YYYY-MM-DD o testo libero)." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addCondition } = healthCtx(ctx);
      addCondition({ name: String(args.name), since: args.since ? String(args.since) : undefined, notes: args.notes ? String(args.notes) : undefined });
      return `Condizione "${args.name}" registrata.`;
    },
  },

  elimina_condizione_medica: {
    declaration: {
      name: "elimina_condizione_medica",
      description: "Rimuove una condizione medica, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) della condizione." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { conditions, removeCondition } = healthCtx(ctx);
      const found = byNameNeedle(conditions, String(args.name));
      if (!found) return `Non ho trovato nessuna condizione con nome simile a "${args.name}".`;
      removeCondition(found.id);
      return `Condizione "${found.name}" rimossa.`;
    },
  },

  aggiungi_intervento_chirurgico: {
    declaration: {
      name: "aggiungi_intervento_chirurgico",
      description: "Registra un intervento chirurgico passato.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome/tipo di intervento." },
          date: { type: "STRING", description: "Data YYYY-MM-DD, se nota." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addSurgery } = healthCtx(ctx);
      addSurgery({ name: String(args.name), date: args.date ? String(args.date) : undefined, notes: args.notes ? String(args.notes) : undefined });
      return `Intervento "${args.name}" registrato.`;
    },
  },

  elimina_intervento_chirurgico: {
    declaration: {
      name: "elimina_intervento_chirurgico",
      description: "Rimuove un intervento chirurgico registrato, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) dell'intervento." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { surgeries, removeSurgery } = healthCtx(ctx);
      const found = byNameNeedle(surgeries, String(args.name));
      if (!found) return `Non ho trovato nessun intervento con nome simile a "${args.name}".`;
      removeSurgery(found.id);
      return `Intervento "${found.name}" rimosso.`;
    },
  },

  aggiungi_familiarita: {
    declaration: {
      name: "aggiungi_familiarita",
      description: "Registra una familiarità/anamnesi familiare per una condizione.",
      parameters: {
        type: "OBJECT",
        properties: {
          condition: { type: "STRING", description: "Nome della condizione." },
          relative: { type: "STRING", description: "Grado di parentela (es. 'madre', 'nonno paterno')." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["condition", "relative"],
      },
    },
    execute: (args, ctx) => {
      const { addFamilyHistory } = healthCtx(ctx);
      addFamilyHistory({ condition: String(args.condition), relative: String(args.relative), notes: args.notes ? String(args.notes) : undefined });
      return `Familiarità per "${args.condition}" (${args.relative}) registrata.`;
    },
  },

  elimina_familiarita: {
    declaration: {
      name: "elimina_familiarita",
      description: "Rimuove una familiarità registrata, cercandola per nome della condizione. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { condition: { type: "STRING", description: "Nome (anche parziale) della condizione." } },
        required: ["condition"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { familyHistory, removeFamilyHistory } = healthCtx(ctx);
      const needle = String(args.condition).trim().toLowerCase();
      const found = familyHistory.find((f) => f.condition.trim().toLowerCase().includes(needle));
      if (!found) return `Non ho trovato nessuna familiarità con condizione simile a "${args.condition}".`;
      removeFamilyHistory(found.id);
      return `Familiarità per "${found.condition}" rimossa.`;
    },
  },

  aggiungi_allergia: {
    declaration: {
      name: "aggiungi_allergia",
      description: "Aggiunge un'allergia nota alla scheda Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome dell'allergene." },
          severity: { type: "STRING", enum: ["lieve", "moderata", "grave"], description: "Gravità della reazione." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addAllergy } = healthCtx(ctx);
      addAllergy({ name: String(args.name), severity: args.severity as Allergy["severity"] });
      return `Allergia a "${args.name}" registrata.`;
    },
  },

  elimina_allergia: {
    declaration: {
      name: "elimina_allergia",
      description: "Rimuove un'allergia registrata, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) dell'allergene." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { allergies, removeAllergy } = healthCtx(ctx);
      const found = byNameNeedle(allergies, String(args.name));
      if (!found) return `Non ho trovato nessuna allergia con nome simile a "${args.name}".`;
      removeAllergy(found.id);
      return `Allergia a "${found.name}" rimossa.`;
    },
  },

  aggiungi_vaccinazione: {
    declaration: {
      name: "aggiungi_vaccinazione",
      description: "Registra una vaccinazione fatta, con eventuale richiamo futuro.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome del vaccino." },
          date: { type: "STRING", description: "Data della vaccinazione YYYY-MM-DD." },
          nextDueDate: { type: "STRING", description: "Data del prossimo richiamo, se previsto." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addVaccination } = healthCtx(ctx);
      addVaccination({
        name: String(args.name),
        date: args.date ? String(args.date) : todayIso(),
        nextDueDate: args.nextDueDate ? String(args.nextDueDate) : undefined,
      });
      return `Vaccinazione "${args.name}" registrata.`;
    },
  },

  elimina_vaccinazione: {
    declaration: {
      name: "elimina_vaccinazione",
      description: "Rimuove una vaccinazione registrata, cercandola per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del vaccino." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { vaccinations, removeVaccination } = healthCtx(ctx);
      const found = byNameNeedle(vaccinations, String(args.name));
      if (!found) return `Non ho trovato nessuna vaccinazione con nome simile a "${args.name}".`;
      removeVaccination(found.id);
      return `Vaccinazione "${found.name}" rimossa.`;
    },
  },

  aggiungi_contatto_medico: {
    declaration: {
      name: "aggiungi_contatto_medico",
      description: "Aggiunge un contatto medico (medico, specialista) alla rubrica di Salute.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome del contatto." },
          role: { type: "STRING", description: "Ruolo/specializzazione." },
          phone: { type: "STRING", description: "Telefono, se noto." },
        },
        required: ["name", "role"],
      },
    },
    execute: (args, ctx) => {
      const { addContact } = healthCtx(ctx);
      addContact({ name: String(args.name), role: String(args.role), phone: args.phone ? String(args.phone) : undefined });
      return `Contatto "${args.name}" (${args.role}) aggiunto.`;
    },
  },

  elimina_contatto_medico: {
    declaration: {
      name: "elimina_contatto_medico",
      description: "Rimuove un contatto medico, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del contatto." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { contacts, removeContact } = healthCtx(ctx);
      const found = byNameNeedle(contacts, String(args.name));
      if (!found) return `Non ho trovato nessun contatto con nome simile a "${args.name}".`;
      removeContact(found.id);
      return `Contatto "${found.name}" rimosso.`;
    },
  },

  registra_sintomo: {
    declaration: {
      name: "registra_sintomo",
      description: "Registra un sintomo avvertito, con intensità da 1 a 5.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome del sintomo (es. 'mal di testa')." },
          severity: { type: "NUMBER", description: "Intensità da 1 (lieve) a 5 (grave)." },
          notes: { type: "STRING", description: "Note facoltative." },
        },
        required: ["name", "severity"],
      },
    },
    execute: (args, ctx) => {
      const { addSymptom } = healthCtx(ctx);
      addSymptom({ name: String(args.name), date: todayIso(), severity: Number(args.severity), notes: args.notes ? String(args.notes) : undefined });
      return `Sintomo "${args.name}" registrato (intensità ${args.severity}).`;
    },
  },

  elimina_sintomo: {
    declaration: {
      name: "elimina_sintomo",
      description: "Rimuove un sintomo registrato, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del sintomo." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { symptoms, removeSymptom } = healthCtx(ctx);
      const found = byNameNeedle(symptoms, String(args.name));
      if (!found) return `Non ho trovato nessun sintomo con nome simile a "${args.name}".`;
      removeSymptom(found.id);
      return `Sintomo "${found.name}" rimosso.`;
    },
  },

  registra_valore_vitale: {
    declaration: {
      name: "registra_valore_vitale",
      description: "Registra una misurazione di pressione, battito o glicemia.",
      parameters: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["pressione", "battito", "glicemia"], description: "Tipo di misurazione." },
          systolic: { type: "NUMBER", description: "Pressione sistolica (solo per tipo 'pressione')." },
          diastolic: { type: "NUMBER", description: "Pressione diastolica (solo per tipo 'pressione')." },
          value: { type: "NUMBER", description: "Valore singolo (per battito o glicemia)." },
        },
        required: ["type"],
      },
    },
    execute: (args, ctx) => {
      const { addVital } = healthCtx(ctx);
      addVital({
        type: args.type as VitalType,
        date: todayIso(),
        systolic: args.systolic !== undefined ? Number(args.systolic) : undefined,
        diastolic: args.diastolic !== undefined ? Number(args.diastolic) : undefined,
        value: args.value !== undefined ? Number(args.value) : undefined,
      });
      return `Misurazione di ${args.type} registrata.`;
    },
  },

  elimina_valore_vitale: {
    declaration: {
      name: "elimina_valore_vitale",
      description: "Rimuove l'ultima misurazione vitale di un tipo indicato. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { type: { type: "STRING", enum: ["pressione", "battito", "glicemia"], description: "Tipo di misurazione." } },
        required: ["type"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { vitals, removeVital } = healthCtx(ctx);
      const matches = vitals.filter((v) => v.type === args.type).sort((a, b) => b.date.localeCompare(a.date));
      if (matches.length === 0) return `Nessuna misurazione di ${args.type} registrata.`;
      removeVital(matches[0].id);
      return `Ultima misurazione di ${args.type} rimossa.`;
    },
  },

  stato_salute: {
    declaration: {
      name: "stato_salute",
      description: "Restituisce farmaci in corso, allergie e appuntamenti medici in programma — usalo per rispondere a domande sullo stato di Salute.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { medications, allergies, appointments } = healthCtx(ctx);
      const meds = medications.length ? medications.map((m) => m.name).join(", ") : "nessuno";
      const allergyList = allergies.length ? allergies.map((a) => a.name).join(", ") : "nessuna";
      const upcoming = appointments.filter((a) => !a.completed);
      const appts = upcoming.length ? upcoming.map((a) => `${a.title} (${a.date})`).join("; ") : "nessuno";
      return `Farmaci in corso: ${meds}. Allergie: ${allergyList}. Appuntamenti in programma: ${appts}.`;
    },
  },
};
