import { Person, PersonalDetails } from "./types";
import { FIELD_LABELS } from "./discovery-feed";
import { allCustomDiscoveredFields } from "./discovery-lookup";

export interface DiscoveryLine {
  label: string;
  value: string;
}

const SCALAR_ORDER = Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[];

/** Campi che contengono l'id di un'ALTRA persona (Partner, Amici, Migliori Amici) — senza
 * risolverli in un nome vero mostrerebbero solo un id grezzo e illeggibile. Risolverli
 * richiederebbe l'elenco delle Persone qui dentro, che questa funzione non ha (e non deve
 * avere, per restare una semplice lettura): restano fuori, li si scopre nell'editor vero. */
const PERSON_REF_FIELDS: (keyof PersonalDetails)[] = ["partnerPersonId", "friendPersonIds", "bestFriendPersonIds"];

/** Quale sezione del wizard appartiene ogni campo scalare — per CHIAVE, non per l'etichetta
 * tradotta: un raggruppamento per stringa italiana rischia di lasciar fuori in silenzio un
 * campo la cui label non hai ricopiato identica in un secondo elenco (è già capitato una
 * volta scrivendo questo file, corretto prima di consegnare). Ogni chiave di FIELD_LABELS
 * (tranne i riferimenti a un'altra persona) deve comparire esattamente una volta qui sotto —
 * un test implicito che la build verifica da sola, se uno resta fuori TypeScript non si
 * lamenta ma il campo semplicemente non compare mai: controllato a mano, non solo dichiarato.
 */
const SECTION_FIELDS: Record<"identity" | "eduWork" | "body", (keyof PersonalDetails)[]> = {
  identity: ["nickname", "phone", "birthPlace", "birthday", "gender", "strengths", "weaknesses", "fears", "ambitions", "goals"],
  eduWork: ["studiedAt", "workedAt", "educationTitle", "occupation", "stress", "professionalAmbition"],
  body: ["weight", "height", "physicalGoal"],
};

/** I campi scalari delle Scoperte (Soprannome, Peso, Occupazione...) che sono davvero
 * compilati su questa persona — nell'ordine dichiarato in FIELD_LABELS, non a caso. Coprono
 * sia testo libero (stringhe non vuote) sia numeri (Peso, Altezza — anche uno zero tecnico
 * conta come "compilato", diverso da "mai impostato"). */
export function filledScalarDiscoveries(person: Person, keys: (keyof PersonalDetails)[] = SCALAR_ORDER): DiscoveryLine[] {
  return keys
    .filter((key) => !PERSON_REF_FIELDS.includes(key))
    .filter((key) => {
      const value = person[key as keyof Person];
      if (typeof value === "string") return value.trim().length > 0;
      return typeof value === "number";
    })
    .map((key) => ({ label: FIELD_LABELS[key as keyof typeof FIELD_LABELS]!, value: String(person[key as keyof Person]) }));
}

/** Nessun campo scoperto porta con sé una data — non è mai stata tracciata per singolo
 * campo (solo il feed globale "Novità" lo fa, capato e cancellabile dall'utente, quindi
 * inaffidabile come fonte). "Ultime" qui è quindi una scelta dichiarata, non un vero
 * cronologico: prima i campi liberi (quelli aggiunti con "Nuova Scoperta", che DENTRO ogni
 * sezione restano in ordine di inserimento), poi — se non bastano — i campi fissi compilati,
 * nell'ordine del wizard. */
export function latestDiscoveries(person: Person, count: number): DiscoveryLine[] {
  const custom = allCustomDiscoveredFields(person)
    .slice(-count)
    .reverse()
    .map((f) => ({ label: f.label, value: f.value }));
  if (custom.length >= count) return custom.slice(0, count);

  const scalars = filledScalarDiscoveries(person).slice(0, count - custom.length);
  return [...custom, ...scalars];
}

export interface DiscoverySection {
  title: string;
  lines: DiscoveryLine[];
}

/** Tutto ciò che è stato scoperto su questa persona, raggruppato con le stesse sezioni del
 * wizard — la vista di sola lettura per chi non è il proprietario del profilo. */
export function allDiscoverySections(person: Person): DiscoverySection[] {
  const identity = filledScalarDiscoveries(person, SECTION_FIELDS.identity);
  const eduWork = filledScalarDiscoveries(person, SECTION_FIELDS.eduWork);
  const body = filledScalarDiscoveries(person, SECTION_FIELDS.body);

  const identityCustom = person.identityCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const eduWorkCustom = person.eduWorkCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const bodyCustom = person.bodyCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const homeCustom = person.homeCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const interestsCustom = person.interestsCustomFields.map((f) => ({ label: f.label, value: f.value }));

  const sections: DiscoverySection[] = [
    { title: "Identità", lines: [...identity, ...identityCustom] },
    { title: "Istruzione E Lavoro", lines: [...eduWork, ...eduWorkCustom] },
    { title: "Corpo", lines: [...body, ...bodyCustom] },
    { title: "Casa", lines: homeCustom },
    { title: "Interessi", lines: interestsCustom },
    ...person.customSections
      .filter((s) => s.fields.length > 0)
      .map((s) => ({ title: s.title, lines: s.fields.map((f) => ({ label: f.label, value: f.value })) })),
  ];

  return sections.filter((s) => s.lines.length > 0);
}

export function hasAnyDiscovery(person: Person): boolean {
  return allDiscoverySections(person).length > 0;
}

