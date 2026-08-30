import { Person, PersonalDetails, ThumbItem } from "./types";
import { FIELD_LABELS } from "./discovery-feed";
import { allCustomDiscoveredFields } from "./discovery-lookup";

export interface DiscoveryLine {
  label: string;
  value: string;
  /** Solo per Film/Musica/Libri/Videogiochi Preferiti (vedi ThumbGridField) — la stessa
   * miniatura del wizard, non solo il titolo in chiaro. */
  imageUrl?: string;
}

const SCALAR_ORDER = Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[];

/** Quale sezione del wizard appartiene ogni campo scalare — per CHIAVE, non per l'etichetta
 * tradotta: un raggruppamento per stringa italiana rischia di lasciar fuori in silenzio un
 * campo la cui label non hai ricopiato identica in un secondo elenco (è già capitato una
 * volta scrivendo questo file, corretto prima di consegnare — vedi Checkpoint 18). */
const SECTION_FIELDS: Record<"identity" | "eduWork" | "body", (keyof PersonalDetails)[]> = {
  identity: ["alias", "phone", "birthPlace", "birthday", "gender", "strengths", "weaknesses", "fears", "ambitions", "goals"],
  eduWork: [
    "studies",
    "currentSchool",
    "futureStudyGoals",
    "futureWorkGoals",
    "works",
    "currentWorkplace",
    "studiedAt",
    "educationTitle",
    "occupation",
    "professionalAmbition",
  ],
  body: ["weight", "height", "physicalGoal"],
};

/** I campi scalari delle Scoperte (Soprannome, Peso, Occupazione...) che sono davvero
 * compilati su questa persona. Coprono sia testo libero (stringhe non vuote) sia numeri
 * (Peso, Altezza — anche uno zero tecnico conta come "compilato", diverso da "mai
 * impostato"). I riferimenti a un'altra persona (Partner, Amici) sono gestiti a parte da
 * `resolvedPersonRefs`, non qui: senza l'elenco delle Persone questa funzione mostrerebbe
 * solo un id grezzo e illeggibile. */
export function filledScalarDiscoveries(person: Person, keys: (keyof PersonalDetails)[] = SCALAR_ORDER): DiscoveryLine[] {
  return keys
    .filter((key) => {
      const value = person[key as keyof Person];
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "boolean") return value === true;
      return typeof value === "number";
    })
    .map((key) => {
      const value = person[key as keyof Person];
      return { label: FIELD_LABELS[key as keyof typeof FIELD_LABELS]!, value: typeof value === "boolean" ? "Sì" : String(value) };
    });
}

/** Una riga per etichetta, tag uniti in un'unica frase leggibile ("Carattere: Empatico,
 * Curioso, Testardo") invece di una riga per singolo tag — così una lista lunga di
 * competenze o materie non affoga il resto della scheda. */
function tagListLine(label: string, tags: string[]): DiscoveryLine[] {
  return tags.length > 0 ? [{ label, value: tags.join(", ") }] : [];
}

function thumbLines(label: string, items: ThumbItem[]): DiscoveryLine[] {
  return items.map((t) => ({ label, value: t.title, imageUrl: t.imageUrl }));
}

/** Partner/Amici/Migliori Amici puntano all'id di un'altra Persona — senza risolverlo qui
 * mostrerebbero solo un id grezzo. Richiede l'elenco delle Persone: solo chi chiama da un
 * punto con `useHousehold()` può fornirlo, per questo è una funzione a parte invece che
 * dentro `filledScalarDiscoveries`. */
function resolvedPersonRefs(person: Person, people: Person[]): DiscoveryLine[] {
  const nameOf = (id?: string) => people.find((p) => p.id === id);
  const lines: DiscoveryLine[] = [];
  if (person.partnerPersonId) {
    const p = nameOf(person.partnerPersonId);
    if (p) lines.push({ label: "Partner", value: `${p.firstName} ${p.lastName}`.trim() });
  }
  const friends = person.friendPersonIds.map(nameOf).filter((p): p is Person => Boolean(p));
  if (friends.length > 0) lines.push({ label: "Amici", value: friends.map((p) => p.firstName).join(", ") });
  const bestFriends = person.bestFriendPersonIds.map(nameOf).filter((p): p is Person => Boolean(p));
  if (bestFriends.length > 0) lines.push({ label: "Migliori amici", value: bestFriends.map((p) => p.firstName).join(", ") });
  return lines;
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

/**
 * Tutto ciò che è stato scoperto su questa persona, raggruppato con le stesse sezioni del
 * wizard — la vista di sola lettura per chi non è il proprietario del profilo.
 *
 * Bug corretto — mancava più di metà del wizard: Carattere, Valori, Stile Di Vita (sezione
 * Identità), Materie Conosciute/Competenze/Abilità/Lingue Conosciute (Istruzione E Lavoro),
 * Film/Musica/Libri/Videogiochi Preferiti con le loro miniature, Cibi Preferiti, Luoghi
 * D'Interesse, Categoria Preferita (Interessi) — tutti campi `string[]`/`ThumbItem[]` che
 * `FIELD_LABELS` non copre affatto (quella mappa è solo per i campi scalari), quindi la
 * prima stesura di questo file non li vedeva proprio. `people` serve solo per risolvere
 * Partner/Amici/Migliori Amici in nomi veri invece di lasciarli fuori — passalo da chi ha
 * `useHousehold()` a disposizione.
 */
export function allDiscoverySections(person: Person, people: Person[]): DiscoverySection[] {
  const identity = filledScalarDiscoveries(person, SECTION_FIELDS.identity);
  const eduWork = filledScalarDiscoveries(person, SECTION_FIELDS.eduWork);
  const body = filledScalarDiscoveries(person, SECTION_FIELDS.body);

  const identityCustom = person.identityCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const eduWorkCustom = person.eduWorkCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const bodyCustom = person.bodyCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const homeCustom = person.homeCustomFields.map((f) => ({ label: f.label, value: f.value }));
  const interestsCustom = person.interestsCustomFields.map((f) => ({ label: f.label, value: f.value }));

  const sections: DiscoverySection[] = [
    {
      title: "Identità",
      lines: [
        ...identity,
        ...tagListLine("Carattere", person.traits),
        ...tagListLine("Valori", person.values),
        ...tagListLine("Stile di vita", person.lifestyle),
        ...identityCustom,
      ],
    },
    {
      title: "Istruzione e lavoro",
      lines: [
        ...eduWork,
        ...tagListLine("Lavori precedenti", person.previousWorkplaces),
        ...tagListLine("Materie conosciute", person.subjects),
        ...tagListLine("Competenze", person.competencies),
        ...tagListLine("Abilità", person.abilities),
        ...tagListLine("Lingue conosciute", person.languages),
        ...eduWorkCustom,
      ],
    },
    { title: "Corpo", lines: [...body, ...bodyCustom] },
    { title: "Casa", lines: homeCustom },
    {
      title: "Interessi",
      lines: [
        ...thumbLines("Film preferiti", person.favoriteMovies),
        ...thumbLines("Musica preferita", person.favoriteMusic),
        ...thumbLines("Libri preferiti", person.favoriteBooks),
        ...thumbLines("Videogiochi preferiti", person.favoriteGames),
        ...tagListLine("Cibi preferiti", person.favoriteFoods),
        ...tagListLine("Luoghi d'interesse", person.placesOfInterest),
        ...tagListLine("Categoria preferita", person.favoriteCategories),
        ...interestsCustom,
      ],
    },
    { title: "Legami", lines: resolvedPersonRefs(person, people) },
    ...person.customSections
      .filter((s) => s.fields.length > 0)
      .map((s) => ({ title: s.title, lines: s.fields.map((f) => ({ label: f.label, value: f.value })) })),
  ];

  return sections.filter((s) => s.lines.length > 0);
}

export function hasAnyDiscovery(person: Person, people: Person[]): boolean {
  return allDiscoverySections(person, people).length > 0;
}
