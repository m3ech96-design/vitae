/**
 * Il grafo di parentela si basa solo su legami diretti — chi sono i due genitori di
 * qualcuno, chi è il coniuge/partner. Tutto il resto (fratelli, nonni, zii, cugini, cognati,
 * suoceri, patrigni, parentele alla lontana di qualunque grado) si CALCOLA da questi legami,
 * non si dichiara a mano — non può mai andare fuori sincrono, e scala da solo a qualunque
 * distanza e a qualunque numero di persone perché è un attraversamento del grafo.
 *
 * Le parole usate qui sotto sono state verificate con una ricerca dedicata (non a intuito),
 * poi corrette su richiesta esplicita: "Fratellastro"/"Sorellastra" è stato eliminato dal
 * vocabolario dell'app — un genitore condiviso, anche uno solo, o anche il semplice crescere
 * nella stessa famiglia allargata per il nuovo matrimonio di un genitore, restano sempre e
 * solo "Fratello"/"Sorella", mai una parola a parte. "Figliastro", "Patrigno" e "Matrigna"
 * non sono nemmeno più categorie del codice civile (sono parole di uso comune, non termini
 * legali) — qui restano, ma con la stessa logica di prima: solo per un vero matrimonio
 * (spouseId), mai per una semplice convivenza (partnerPersonId), perché l'affinità in Italia
 * (art. 78 c.c.) nasce solo dal matrimonio.
 */
export interface FamilyEntity {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gender?: string;
  deceased?: boolean;
  /** Solo l'anno serve qui — la data completa (giorno/mese) resta sulla scheda della
   * persona, vedi lib/date-format.ts `lifespanLabel`. */
  deceasedYear?: number;
  birthday?: string;
  /** Serve solo per scegliere "Sconosciuto"/"Sconosciuta" quando l'avatar è vuoto — vedi
   * lib/unknown-relative.ts. */
  kind?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  exSpouseIds: string[];
  partnerPersonId?: string;
}

/** A quale ramo appartiene un legame — usato per raggruppare l'Albero in sezioni con un
 * senso, non per un'etichetta o l'altra a caso. */
/** Su richiesta esplicita, "Famiglia Di Provenienza" ora è riservata a SOLO genitori e
 * fratelli/sorelle — tutto il resto del sangue oltre quel primo cerchio (nonni, prozii, zii,
 * cugini, nipoti di un fratello/sorella) vive nel proprio ramo "estesa"; le parentele nate
 * da un matrimonio (suoceri, cognati in entrambe le direzioni, generi/nuore, figliastri, e i
 * ponti generici senza una parola propria) vivono tutte in "acquisita". Non più "lontano":
 * un parente raggiungibile solo dal grafo, senza alcun grado nominabile, non compare più
 * nell'Albero di una singola persona (vedi la nota su `relationshipInfo`), quindi non serve
 * più nemmeno un suo ramo a parte. */
export type FamilyBranch = "coniuge" | "provenienza" | "estesa" | "discendenza" | "acquisita";

export interface RelationshipInfo {
  label: string;
  branch: FamilyBranch;
}

export function isMale(e?: FamilyEntity): boolean {
  return e?.gender === "Uomo" || e?.gender === "Maschio";
}
export function isFemale(e?: FamilyEntity): boolean {
  return e?.gender === "Donna" || e?.gender === "Femmina";
}

function childWord(e?: FamilyEntity) {
  return isMale(e) ? "Figlio" : isFemale(e) ? "Figlia" : "Figlio/A";
}
/** Ognuna di queste, su richiesta esplicita, non ammette più una terza forma ibrida
 * ("Fratello/Sorella", "Zio/A", "Genitore", "Nonno/A", e le stesse "collegate e annesse" —
 * "Prozio/A"): sempre e solo le due parole vere, in base al sesso registrato. Quando il
 * sesso non è (ancora) noto o non è binario, resta la forma maschile — il non marcato della
 * grammatica italiana in questi casi — non una terza etichetta di comodo. */
function parentWord(e?: FamilyEntity) {
  return isFemale(e) ? "Madre" : "Padre";
}
function siblingWord(e?: FamilyEntity) {
  return isFemale(e) ? "Sorella" : "Fratello";
}
function spouseWord(e?: FamilyEntity) {
  return isMale(e) ? "Marito" : isFemale(e) ? "Moglie" : "Coniuge";
}
function exSpouseWord(e?: FamilyEntity) {
  return isMale(e) ? "Ex marito" : isFemale(e) ? "Ex moglie" : "Ex coniuge";
}
function uncleAuntWord(e?: FamilyEntity) {
  return isFemale(e) ? "Zia" : "Zio";
}
function greatUncleAuntWord(e?: FamilyEntity) {
  return isFemale(e) ? "Prozia" : "Prozio";
}
function grandparentWord(e: FamilyEntity | undefined, greats: number) {
  const base = isFemale(e) ? "Nonna" : "Nonno";
  return greats <= 0 ? base : `${"Bis".repeat(greats)}${base}`;
}
function grandchildLabel(greats: number) {
  const base = "Nipote";
  return greats <= 0 ? `${base} (di un figlio o una figlia)` : `${"Pro".repeat(Math.max(1, greats))}nipote`;
}
function niblingLabel() {
  return "Nipote (di un fratello o una sorella)";
}
function cousinWord(e?: FamilyEntity) {
  return isMale(e) ? "Cugino" : isFemale(e) ? "Cugina" : "Cugino/A";
}
function inLawParentWord(e?: FamilyEntity) {
  return isMale(e) ? "Suocero" : isFemale(e) ? "Suocera" : "Suocero/A";
}
function inLawChildWord(e?: FamilyEntity) {
  return isMale(e) ? "Genero" : isFemale(e) ? "Nuora" : "Genero/Nuora";
}
function inLawSiblingWord(e?: FamilyEntity) {
  return isMale(e) ? "Cognato" : isFemale(e) ? "Cognata" : "Cognato/A";
}
function stepChildWord(e?: FamilyEntity) {
  return isMale(e) ? "Figliastro" : isFemale(e) ? "Figliastra" : "Figliastro/A";
}

function ordinalWord(n: number): string {
  const words = ["", "primo", "secondo", "terzo", "quarto", "quinto", "sesto", "settimo", "ottavo"];
  return words[n] || `${n}°`;
}

/** Distanza in generazioni di ogni antenato di `id` (padre/madre a ritroso), incluso `id`
 * stesso a distanza 0. BFS semplice: anche per alberi enormi resta O(persone) per chiamata. */
function ancestorDistances(id: string, byId: Map<string, FamilyEntity>): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: [string, number][] = [[id, 0]];
  while (queue.length > 0) {
    const [curId, d] = queue.shift()!;
    if (dist.has(curId)) continue;
    dist.set(curId, d);
    const e = byId.get(curId);
    if (e?.fatherId) queue.push([e.fatherId, d + 1]);
    if (e?.motherId) queue.push([e.motherId, d + 1]);
  }
  return dist;
}

/** L'antenato comune più vicino tra focus e other (somma delle due distanze minima), se
 * esiste — la base di tutta la parentela di sangue, in linea diretta o collaterale. */
function closestCommonAncestor(
  focusId: string,
  otherId: string,
  byId: Map<string, FamilyEntity>
): { focusDist: number; otherDist: number } | null {
  const focusAnc = ancestorDistances(focusId, byId);
  const otherAnc = ancestorDistances(otherId, byId);
  let best: { focusDist: number; otherDist: number } | null = null;
  focusAnc.forEach((fd, ancId) => {
    const od = otherAnc.get(ancId);
    if (od === undefined) return;
    if (!best || fd + od < best.focusDist + best.otherDist) best = { focusDist: fd, otherDist: od };
  });
  return best;
}

/** Condividono almeno un genitore? Nell'uso comune di oggi basta uno solo perché due
 * persone si chiamino "Fratello"/"Sorella" — vedi la nota in testa al file. Un genitore
 * semplicemente non registrato NON conta come "diverso": non si etichetta mai con sicurezza
 * qualcosa che non si sa, quindi qui non serve nemmeno distinguere i due casi. */
function shareAParent(a: FamilyEntity, b: FamilyEntity): boolean {
  const shareFather = Boolean(a.fatherId) && a.fatherId === b.fatherId;
  const shareMother = Boolean(a.motherId) && a.motherId === b.motherId;
  return shareFather || shareMother;
}

/** Grado di parentela DI SANGUE di `other` rispetto a `focus`, in linea diretta o
 * collaterale, a qualunque distanza — mai un elenco da consultare, sempre calcolato.
 * `direction` dice se other discende da focus, se focus discende da other, o se il legame
 * è collaterale — è quello che decide poi la sezione dell'Albero in cui finisce. */
/** Grado di parentela DI SANGUE di `other` rispetto a `focus`, in linea diretta o
 * collaterale, a qualunque distanza — mai un elenco da consultare, sempre calcolato.
 * `direction` dice se other discende da focus, se focus discende da other, o se il legame
 * è collaterale — è quello che decide poi la sezione dell'Albero in cui finisce. `scope`
 * distingue il primo cerchio (un genitore o un fratello/sorella — resta "Famiglia Di
 * Provenienza") da tutto il sangue più lontano (nonni, zii, cugini, nipoti di un
 * fratello/sorella — finisce in "Famiglia Estesa"): la discendenza (figli, nipoti di figli)
 * non ha bisogno di questa distinzione, resta comunque tutta in un unico ramo.
 */
function bloodLabel(
  focus: FamilyEntity,
  other: FamilyEntity,
  byId: Map<string, FamilyEntity>
): { label: string; direction: "down" | "up" | "collateral"; scope: "immediato" | "esteso" } | null {
  if (shareAParent(focus, other)) return { label: siblingWord(other), direction: "collateral", scope: "immediato" };

  const common = closestCommonAncestor(focus.id, other.id, byId);
  if (!common) return null;
  const { focusDist, otherDist } = common;

  if (focusDist === 0 && otherDist === 0) return null; // stessa persona
  if (focusDist === 0) {
    // other discende da focus in linea diretta
    if (otherDist === 1) return { label: childWord(other), direction: "down", scope: "immediato" };
    return { label: grandchildLabel(otherDist - 2), direction: "down", scope: "esteso" };
  }
  if (otherDist === 0) {
    // focus discende da other in linea diretta
    if (focusDist === 1) return { label: parentWord(other), direction: "up", scope: "immediato" };
    return { label: grandparentWord(other, focusDist - 2), direction: "up", scope: "esteso" };
  }

  const closest = Math.min(focusDist, otherDist);
  const removed = Math.abs(focusDist - otherDist);

  if (closest === 1) {
    // un salto da un lato, più salti dall'altro: zio/zia o nipote (di fratello/sorella), e oltre
    if (focusDist === 2 && otherDist === 1)
      return { label: removed === 1 ? uncleAuntWord(other) : greatUncleAuntWord(other), direction: "collateral", scope: "esteso" };
    if (focusDist === 1 && otherDist === 2)
      return { label: removed === 1 ? niblingLabel() : `${niblingLabel()} alla lontana`, direction: "collateral", scope: "esteso" };
    if (focusDist === 3 && otherDist === 1) return { label: greatUncleAuntWord(other), direction: "collateral", scope: "esteso" };
    if (focusDist === 1 && otherDist === 3) return { label: niblingLabel(), direction: "collateral", scope: "esteso" };
    return { label: "Parente alla lontana", direction: "collateral", scope: "esteso" };
  }

  // Cugini: il grado è quanto sono lontani dall'antenato comune, "removed" è la differenza
  // di generazione tra i due (un cugino di tuo padre è comunque un cugino, ma "rimosso").
  const degree = closest - 1;
  const degreeLabel = degree === 1 ? "" : ` di ${ordinalWord(degree)} grado`;
  const label = removed === 0 ? `${cousinWord(other)}${degreeLabel}` : `${cousinWord(other)}${degreeLabel} alla lontana`;
  return { label, direction: "collateral", scope: "esteso" };
}

/** Un tuo genitore ha sposato un genitore di other, e non condividete alcun genitore di
 * sangue. Su richiesta esplicita, qui non esiste più una parola a parte per questo
 * legame ("Fratellastro"/"Sorellastra" è stato eliminato dal vocabolario dell'app): chi
 * cresce nella stessa famiglia allargata resta "Fratello"/"Sorella" come chiunque altro,
 * il ramo "provenienza" lo colloca comunque nel posto giusto dell'Albero. Richiede un
 * matrimonio vero: la convivenza non crea questo legame (vedi nota in testa al file). */
function stepSiblingBridge(
  focus: FamilyEntity,
  other: FamilyEntity,
  byId: Map<string, FamilyEntity>
): FamilyEntity | null {
  const focusParents = [focus.fatherId, focus.motherId].filter((x): x is string => Boolean(x));
  const otherParents = [other.fatherId, other.motherId].filter((x): x is string => Boolean(x));
  for (const fp of focusParents) {
    const parent = byId.get(fp);
    if (parent?.spouseId && otherParents.includes(parent.spouseId)) return parent;
  }
  return null;
}

/**
 * Grado di parentela di `other` rispetto a `focus` — di sangue se c'è un antenato comune,
 * per il vero matrimonio di un genitore (fratellastro/patrigno/figliastro), per affinità
 * (coniuge, suoceri, cognati, generi/nuore), o per un ponte più lontano — a qualunque
 * distanza. Ogni volta che non esiste un ruolo preciso, il nome della persona-ponte entra
 * nell'etichetta stessa ("Cugino Di Marco"), mai una formula generica senza nome. Restituisce
 * sempre qualcosa per chiunque sia comunque connesso — l'ultima riga in fondo, "Parente Alla
 * Lontana", copre chi non rientra in nessuna delle regole sopra (l'Albero di una singola
 * persona però non la mostra più, vedi il filtro in app/albero/[id]/page.tsx).
 */
export function relationshipInfo(
  focusId: string,
  otherId: string,
  byId: Map<string, FamilyEntity>
): RelationshipInfo | null {
  if (focusId === otherId) return null;
  const focus = byId.get(focusId);
  const other = byId.get(otherId);
  if (!focus || !other) return null;

  if (focus.spouseId === otherId) return { label: spouseWord(other), branch: "coniuge" };
  if (focus.exSpouseIds.includes(otherId)) return { label: exSpouseWord(other), branch: "coniuge" };
  if (focus.partnerPersonId === otherId) return { label: "Partner", branch: "coniuge" };

  const blood = bloodLabel(focus, other, byId);
  if (blood) {
    const branch: FamilyBranch =
      blood.direction === "down" ? "discendenza" : blood.scope === "immediato" ? "provenienza" : "estesa";
    return { label: blood.label, branch };
  }

  const stepParent = stepSiblingBridge(focus, other, byId);
  if (stepParent) return { label: siblingWord(other), branch: "provenienza" };

  // Genitore di focus che ha sposato other: other è patrigno/matrigna — su richiesta
  // esplicita non esiste più come concetto a sé, resta "Madre"/"Padre" come chiunque altro
  // in questo ruolo, e per questo finisce nella stessa categoria "Genitori". Verificato
  // prima del ramo generale sotto perché ha un ruolo preciso, non un affine qualsiasi.
  for (const pid of [focus.fatherId, focus.motherId]) {
    if (pid && byId.get(pid)?.spouseId === otherId) return { label: parentWord(other), branch: "provenienza" };
  }

  // Parente del coniuge vero di focus (suoceri, cognati, figliastri) — solo spouseId: la
  // convivenza non crea affinità in Italia (art. 78 c.c.), quindi per il partner il legame
  // resta visibile ma con parole più morbide, mai i termini legali. Tutta questa famiglia
  // acquisita col matrimonio vive nel ramo "acquisita", mai in "Famiglia Di Provenienza".
  if (focus.spouseId) {
    const spouse = byId.get(focus.spouseId);
    if (spouse) {
      const rel = bloodLabel(spouse, other, byId);
      if (rel) {
        if (rel.direction === "up") return { label: inLawParentWord(other), branch: "acquisita" };
        if (rel.direction === "collateral" && rel.label.startsWith(siblingWord(other)))
          return { label: inLawSiblingWord(other), branch: "acquisita" };
        if (rel.direction === "down" && (rel.label === "Figlio" || rel.label === "Figlia"))
          return { label: stepChildWord(other), branch: "acquisita" };
        return { label: `${rel.label} di ${spouse.firstName} (coniuge)`, branch: "acquisita" };
      }
    }
  }
  if (focus.partnerPersonId) {
    const partner = byId.get(focus.partnerPersonId);
    if (partner) {
      const rel = bloodLabel(partner, other, byId);
      if (rel) return { label: `${rel.label} del partner`, branch: "acquisita" };
    }
  }

  // Coniuge/partner vero di un parente di sangue di focus (cognati, generi/nuore, patrigni
  // visti dall'altro lato) — stessa distinzione spouseId/partnerPersonId di sopra. Il
  // cognato — su richiesta esplicita — non vive più in "Famiglia Di Provenienza": è
  // comunque un legame nato da un matrimonio, non di sangue, quindi va in "acquisita" come
  // tutto il resto della stessa famiglia. Resta in "provenienza" solo il vero patrigno/
  // matrigna (visto da questo lato) — rietichettato "Madre"/"Padre" come sopra, e SOLO se
  // il parente di sangue in questione è un genitore vero (non un nonno o oltre: uno
  // step-nonno non è "Nonno", resta un ponte generico in "acquisita").
  if (other.spouseId && byId.has(other.spouseId)) {
    const otherSpouse = byId.get(other.spouseId)!;
    const rel = bloodLabel(focus, otherSpouse, byId);
    if (rel) {
      if (rel.direction === "collateral" && rel.label.startsWith(siblingWord(otherSpouse)))
        return { label: inLawSiblingWord(other), branch: "acquisita" };
      if (rel.direction === "down") return { label: inLawChildWord(other), branch: "discendenza" };
      if (rel.direction === "up" && rel.scope === "immediato") return { label: parentWord(other), branch: "provenienza" };
      return { label: `Coniuge di ${otherSpouse.firstName}`, branch: "acquisita" };
    }
  }
  if (other.partnerPersonId && byId.has(other.partnerPersonId)) {
    const otherPartner = byId.get(other.partnerPersonId)!;
    const rel = bloodLabel(focus, otherPartner, byId);
    if (rel) return { label: `Partner di ${otherPartner.firstName}`, branch: rel.direction === "down" ? "discendenza" : "acquisita" };
  }

  // Comunque connesso (BFS lo trova), ma nessuna delle regole sopra riesce a nominarlo con
  // precisione — un ponte troppo lungo per un termine italiano. Non sparisce mai in
  // silenzio dal grafo (resta comunque calcolabile, per esempio per non spezzare
  // `groupFamilies`), ma l'Albero di una singola persona, su richiesta esplicita, non lo
  // mostra più: vedi il filtro in app/albero/[id]/page.tsx.
  return { label: "Parente alla lontana", branch: "acquisita" };
}

/** Solo l'etichetta, per chi non ha bisogno del ramo (usato raramente fuori dall'Albero). */
export function relationshipLabel(focusId: string, otherId: string, byId: Map<string, FamilyEntity>): string | null {
  return relationshipInfo(focusId, otherId, byId)?.label ?? null;
}

function neighborsOf(e: FamilyEntity): string[] {
  return [e.fatherId, e.motherId, e.spouseId, e.partnerPersonId, ...e.exSpouseIds].filter(
    (x): x is string => Boolean(x)
  );
}

/** Tutti gli id collegati (in entrambe le direzioni) a startId, per costruire un albero —
 * BFS su un grafo con al massimo 5 archi per persona: resta rapido anche con centinaia di
 * persone intrecciate, perché ogni persona viene visitata una sola volta. */
export function connectedFamilyIds(startId: string, all: FamilyEntity[]): string[] {
  const byId = new Map(all.map((e) => [e.id, e]));
  const reverseIndex = new Map<string, string[]>();
  all.forEach((e) => {
    neighborsOf(e).forEach((n) => {
      if (!reverseIndex.has(n)) reverseIndex.set(n, []);
      reverseIndex.get(n)!.push(e.id);
    });
  });

  const visited = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const e = byId.get(id);
    if (e) neighborsOf(e).forEach((n) => !visited.has(n) && queue.push(n));
    (reverseIndex.get(id) || []).forEach((n) => !visited.has(n) && queue.push(n));
  }
  return [...visited];
}

export interface FamilyGroup {
  ids: string[];
  surnames: string[];
}

/**
 * Non più un blob unico per ogni componente connessa (con famiglie allargate, un solo
 * "Famiglia Fioretti, Gentile, Roberti, Balducci" con dentro tutti quanti diventava
 * illeggibile). Ora una voce per ogni COPPIA sposata — "Famiglia Fioretti, Gentile" mostra
 * solo chi porta uno dei due cognomi, anche se sotto è la stessa identica famiglia allargata
 * di "Famiglia Roberti, Balducci": sono due porte sullo stesso grafo, non due alberi diversi
 * — aprendo il dettaglio di uno qualunque dei due vedi comunque tutti i ponti verso l'altro.
 * Chi non ha un proprio coniuge registrato ma resta comunque connesso a una famiglia (single,
 * genitori non sposati) finisce in un gruppo di riserva a cognome singolo, mai perso. Solo chi
 * non ha alcun legame familiare resta "Senza Famiglia Collegata", come prima.
 */
export function groupFamilies(all: FamilyEntity[]): FamilyGroup[] {
  const byId = new Map(all.map((e) => [e.id, e]));
  const groups: FamilyGroup[] = [];
  const usedLabels = new Set<string>();
  const covered = new Set<string>();

  // Una coppia per ogni spouseId reciproco, una sola volta (non due, andata e ritorno).
  const couples: [FamilyEntity, FamilyEntity][] = [];
  const seenPairs = new Set<string>();
  all.forEach((e) => {
    if (!e.spouseId) return;
    const spouse = byId.get(e.spouseId);
    if (!spouse || spouse.spouseId !== e.id) return;
    const key = [e.id, spouse.id].sort().join("|");
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    couples.push([e, spouse]);
  });

  couples.forEach(([a, b]) => {
    const surnames = [...new Set([a.lastName, b.lastName].filter(Boolean))];
    if (surnames.length === 0) return;
    let label = surnames.join(", ");
    if (usedLabels.has(label)) label = `${label} (${a.firstName})`;
    usedLabels.add(label);
    const ids = all.filter((e) => surnames.includes(e.lastName)).map((e) => e.id);
    ids.forEach((id) => covered.add(id));
    groups.push({ ids, surnames: label.split(", ") });
  });

  // Chi resta: connesso a QUALCUNO ma non coperto da nessuna coppia sopra — un gruppo di
  // riserva a cognome singolo, mai un limbo. Chi invece non ha alcun legame familiare (la
  // sua stessa componente connessa è solo se stesso) resta fuori: lo gestisce già
  // "Senza Famiglia Collegata" in FamilyMenu.
  const bySurname = new Map<string, string[]>();
  all.forEach((e) => {
    if (covered.has(e.id)) return;
    if (!e.lastName) return;
    if (connectedFamilyIds(e.id, all).length <= 1) return;
    bySurname.set(e.lastName, [...(bySurname.get(e.lastName) ?? []), e.id]);
  });
  bySurname.forEach((ids, surname) => groups.push({ ids, surnames: [surname] }));

  return groups;
}

