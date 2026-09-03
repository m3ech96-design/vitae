import { GenealogyPerson, GenealogyRelationship } from "./genealogy-types";
import { GenealogyLayoutRole, GenealogyRelationshipType } from "./genealogy-relationship-types";

export interface GenealogyLayoutNode {
  personId: string;
  /** Colonna in "unità di slot" — il componente che disegna moltiplica per uno spazio in
   * pixel; qui restano unità astratte, indipendenti dalla resa a schermo (vedi la nota in
   * lib/genealogy-types.ts: le coordinate non sono la relazione, sono solo disposizione). */
  x: number;
  /** Generazione: 0 la persona di riferimento, negativo verso l'alto (ascendenti), positivo
   * verso il basso (discendenti). */
  generation: number;
  /** Un nodo "di confine" (partner o "altro" — zio, cugino...) è mostrato ma il suo ramo non
   * viene mai espanso: esattamente la regola del punto 9 (l'esempio di Anna Bianchi). Un nodo
   * non di confine fa parte della linea di sangue diretta o dei fratelli della persona di
   * riferimento. */
  isBoundary: boolean;
}

export interface GenealogyLayoutEdge {
  relationshipId: string;
  personXId: string;
  personYId: string;
  /** Il ruolo (dal punto di vista di X) usato solo per scegliere lo stile del collegamento
   * (linea di sangue, di coppia, ecc.) — mai per dedurre o mostrare un'etichetta: quella resta
   * sempre il testo scritto a mano sulla relazione stessa. */
  styleRole: GenealogyLayoutRole;
  /** true se uno dei due tipi (in una direzione o nell'altra) è marcato come adottivo nel
   * catalogo — punto 7 delle istruzioni: distinguere anche le relazioni adottive da quelle
   * biologiche, non solo genitore/figlio, coppia e fratelli. Pura resa grafica della linea,
   * come styleRole: non aggiunge né deduce alcuna relazione. */
  isAdoptive: boolean;
}

export interface GenealogyLayoutResult {
  nodes: GenealogyLayoutNode[];
  edges: GenealogyLayoutEdge[];
  minX: number;
  maxX: number;
  minGeneration: number;
  maxGeneration: number;
}

interface Neighbor {
  other: string;
  typeId: string;
  relationshipId: string;
}

function neighborsOf(personId: string, relationships: GenealogyRelationship[]): Neighbor[] {
  const result: Neighbor[] = [];
  for (const r of relationships) {
    if (r.personXId === personId) result.push({ other: r.personYId, typeId: r.typeIdForY, relationshipId: r.id });
    else if (r.personYId === personId) result.push({ other: r.personXId, typeId: r.typeIdForX, relationshipId: r.id });
  }
  return result;
}

/** Ordine di nascita quando conosciuto, altrimenti in fondo — solo per decidere l'ordine di
 * disegno da sinistra a destra sulla stessa riga (fratelli, e la persona di riferimento tra
 * loro): un dettaglio grafico, non una relazione dedotta. */
function birthOrdinal(person: GenealogyPerson | undefined): number {
  if (!person?.birthYear) return Number.MAX_SAFE_INTEGER;
  return person.birthYear * 372 + (person.birthMonth ?? 0) * 31 + (person.birthDay ?? 0);
}

/**
 * Scopre quali persone compaiono nell'albero centrato su `referencePersonId` e con quali
 * collegamenti, rispettando il confine del punto 9 delle istruzioni originali: si espande
 * liberamente lungo ascendenti, discendenti e fratelli DELLA SOLA persona di riferimento; un
 * partner (o uno zio/cugino/"altro") si mostra accanto a chiunque sia già nell'albero, ma il
 * suo stesso ramo — i suoi genitori, i suoi altri figli, i suoi fratelli — resta chiuso finché
 * non diventa lui la persona di riferimento. Nessuna relazione viene dedotta: tutto ciò che
 * appare è già stato scritto a mano da qualche parte nei dati.
 */
export function computeGenealogyLayout(
  referencePersonId: string,
  relationships: GenealogyRelationship[],
  people: GenealogyPerson[],
  types: GenealogyRelationshipType[]
): GenealogyLayoutResult {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const typesById = new Map(types.map((t) => [t.id, t]));
  const roleOf = (typeId: string): GenealogyLayoutRole => typesById.get(typeId)?.layoutRole ?? "other";

  if (!peopleById.has(referencePersonId)) {
    return { nodes: [], edges: [], minX: 0, maxX: 0, minGeneration: 0, maxGeneration: 0 };
  }

  // --- Fase 1: scoperta dei nodi -----------------------------------------------------------

  const core = new Map<string, number>(); // personId -> generazione
  const descendantChildren = new Map<string, string[]>();
  const ascendantParents = new Map<string, string[]>();
  const siblingIds: string[] = [];

  function walkDescendants(personId: string, generation: number, visited: Set<string>) {
    if (visited.has(personId)) return;
    visited.add(personId);
    if (!core.has(personId)) core.set(personId, generation);
    const kids: string[] = [];
    for (const n of neighborsOf(personId, relationships)) {
      // Il controllo "!visited.has(n.other)" evita non solo un giro a vuoto, ma soprattutto
      // un CICLO nella struttura descendantChildren stessa (es. un errore di inserimento che
      // registra A come figlio di B e B come figlio di A): senza questo controllo il ciclo
      // resterebbe nella mappa anche dopo la scoperta, e il calcolo delle larghezze — che non
      // ha una propria protezione dai cicli — andrebbe in ricorsione infinita.
      if (roleOf(n.typeId) === "descendant" && !visited.has(n.other)) {
        kids.push(n.other);
        walkDescendants(n.other, generation + 1, visited);
      }
    }
    descendantChildren.set(personId, kids);
  }

  function walkAscendants(personId: string, generation: number, visited: Set<string>) {
    if (visited.has(personId)) return;
    visited.add(personId);
    if (!core.has(personId)) core.set(personId, generation);
    const parents: string[] = [];
    for (const n of neighborsOf(personId, relationships)) {
      if (roleOf(n.typeId) === "ascendant" && !visited.has(n.other)) {
        parents.push(n.other);
        walkAscendants(n.other, generation - 1, visited);
      }
    }
    ascendantParents.set(personId, parents);
  }

  core.set(referencePersonId, 0);
  walkDescendants(referencePersonId, 0, new Set());
  walkAscendants(referencePersonId, 0, new Set());

  // Fratelli della sola persona di riferimento — un solo passo, non ricorsivo: i loro rami
  // (genitori, figli, fratelli) restano chiusi come qualunque altro nodo di confine.
  for (const n of neighborsOf(referencePersonId, relationships)) {
    if (roleOf(n.typeId) === "sibling" && !core.has(n.other)) {
      core.set(n.other, 0);
      siblingIds.push(n.other);
    }
  }

  // Nodi di confine: partner e "altro" (zio, cugino...) di OGNI nodo già scoperto — mostrati,
  // ma il loro stesso ramo non viene mai percorso oltre.
  const boundary = new Map<string, { generation: number; anchor: string }>();
  for (const [personId, generation] of [...core.entries()]) {
    for (const n of neighborsOf(personId, relationships)) {
      if (core.has(n.other) || boundary.has(n.other)) continue;
      const role = roleOf(n.typeId);
      if (role === "partner" || role === "other") {
        boundary.set(n.other, { generation, anchor: personId });
      }
    }
  }

  // --- Fase 2: collegamenti da disegnare ----------------------------------------------------
  // Ogni relazione i cui due estremi sono già nell'albero viene disegnata — anche se non è
  // stata lei a "scoprire" uno dei due nodi (es. un fratello collegato allo stesso genitore
  // già mostrato tramite la persona di riferimento): il grafo mostrato deve riflettere tutti
  // i legami veri tra chi è in vista, non solo quelli usati per costruirla.
  const included = new Set<string>([...core.keys(), ...boundary.keys()]);
  const edges: GenealogyLayoutEdge[] = relationships
    .filter((r) => included.has(r.personXId) && included.has(r.personYId))
    .map((r) => ({
      relationshipId: r.id,
      personXId: r.personXId,
      personYId: r.personYId,
      styleRole: roleOf(r.typeIdForY),
      isAdoptive: typesById.get(r.typeIdForY)?.visualEmphasis === "adoptive" || typesById.get(r.typeIdForX)?.visualEmphasis === "adoptive",
    }));

  // --- Fase 3: larghezze dei sottoalberi -----------------------------------------------------

  function boundaryCountOf(personId: string): number {
    let n = 0;
    boundary.forEach((b) => {
      if (b.anchor === personId) n++;
    });
    return n;
  }
  function baseWidth(personId: string): number {
    return 1 + boundaryCountOf(personId);
  }

  const descendantWidthCache = new Map<string, number>();
  function descendantSubtreeWidth(personId: string, guard: Set<string> = new Set()): number {
    if (descendantWidthCache.has(personId)) return descendantWidthCache.get(personId)!;
    // Ulteriore rete di sicurezza oltre a quella in walkDescendants: se per qualunque motivo
    // un ciclo comparisse comunque qui, si interrompe la ricorsione invece di andare in stack
    // overflow — l'interfaccia non deve mai rompersi, come richiesto esplicitamente.
    if (guard.has(personId)) return 1;
    guard.add(personId);
    const kids = descendantChildren.get(personId) ?? [];
    const own = baseWidth(personId);
    const width = kids.length === 0 ? own : Math.max(own, kids.reduce((sum, k) => sum + descendantSubtreeWidth(k, guard), 0));
    descendantWidthCache.set(personId, width);
    return width;
  }

  const ascendantWidthCache = new Map<string, number>();
  function ascendantSubtreeWidth(personId: string, guard: Set<string> = new Set()): number {
    if (ascendantWidthCache.has(personId)) return ascendantWidthCache.get(personId)!;
    if (guard.has(personId)) return 1;
    guard.add(personId);
    const parents = ascendantParents.get(personId) ?? [];
    const own = baseWidth(personId);
    const width = parents.length === 0 ? own : Math.max(own, parents.reduce((sum, p) => sum + ascendantSubtreeWidth(p, guard), 0));
    ascendantWidthCache.set(personId, width);
    return width;
  }

  // La colonna della persona di riferimento deve essere abbastanza larga da contenere sia il
  // suo ramo discendente sia quello ascendente, altrimenti l'uno o l'altro potrebbe
  // sovrapporsi ai fratelli sulla stessa riga.
  const referenceColumnWidth = Math.max(
    baseWidth(referencePersonId),
    descendantSubtreeWidth(referencePersonId),
    ascendantSubtreeWidth(referencePersonId)
  );

  // --- Fase 4: posizionamento ----------------------------------------------------------------

  const nodes: GenealogyLayoutNode[] = [];
  // Protezione per il caso limite "persona raggiungibile da due percorsi diversi" (es. una
  // stessa persona discendente di due rami che si incrociano): senza questa guardia verrebbe
  // piazzata due volte, duplicando il nodo — qui vince sempre la prima posizione trovata, i
  // tentativi successivi non fanno nulla.
  const placedIds = new Set<string>();

  function placeNode(personId: string, x: number, generation: number, isBoundary: boolean) {
    if (placedIds.has(personId)) return;
    placedIds.add(personId);
    nodes.push({ personId, x, generation, isBoundary });
    let bx = x + 0.5; // i nodi di confine iniziano subito a destra dell'ancora
    boundary.forEach((b, boundaryId) => {
      if (b.anchor !== personId || placedIds.has(boundaryId)) return;
      bx += 1;
      placedIds.add(boundaryId);
      nodes.push({ personId: boundaryId, x: bx - 0.5, generation, isBoundary: true });
    });
  }

  function placeDescendantSubtree(personId: string, xStart: number, xEnd: number, generation: number) {
    const alreadyPlaced = placedIds.has(personId);
    const width = xEnd - xStart;
    placeNode(personId, xStart + width / 2 - baseWidth(personId) / 2, generation, false);
    if (alreadyPlaced) return;
    const kids = descendantChildren.get(personId) ?? [];
    if (kids.length === 0) return;
    const childWidths = kids.map((k) => descendantSubtreeWidth(k));
    const totalChildWidth = childWidths.reduce((a, b) => a + b, 0);
    // Se i figli occupano meno della larghezza disponibile, li si centra nello spazio dato
    // invece di lasciarli tutti addossati a sinistra.
    let cursor = xStart + Math.max(0, (width - totalChildWidth) / 2);
    kids.forEach((k, i) => {
      const w = childWidths[i];
      placeDescendantSubtree(k, cursor, cursor + w, generation + 1);
      cursor += w;
    });
  }

  function placeAscendantSubtree(personId: string, xStart: number, xEnd: number, generation: number) {
    const alreadyPlaced = placedIds.has(personId);
    const width = xEnd - xStart;
    placeNode(personId, xStart + width / 2 - baseWidth(personId) / 2, generation, false);
    if (alreadyPlaced) return;
    const parents = ascendantParents.get(personId) ?? [];
    if (parents.length === 0) return;
    const parentWidths = parents.map((p) => ascendantSubtreeWidth(p));
    const totalParentWidth = parentWidths.reduce((a, b) => a + b, 0);
    let cursor = xStart + Math.max(0, (width - totalParentWidth) / 2);
    parents.forEach((p, i) => {
      const w = parentWidths[i];
      placeAscendantSubtree(p, cursor, cursor + w, generation - 1);
      cursor += w;
    });
  }

  // Riga centrale: fratelli + persona di riferimento, ordinati per data di nascita quando
  // nota (solo per l'ordine di disegno, non una relazione dedotta — vedi birthOrdinal).
  const middleRowIds = [...siblingIds, referencePersonId].sort(
    (a, b) => birthOrdinal(peopleById.get(a)) - birthOrdinal(peopleById.get(b))
  );
  const middleWidths = middleRowIds.map((id) => (id === referencePersonId ? referenceColumnWidth : baseWidth(id)));

  let cursor = 0;
  let referenceX = 0;
  let referenceSlotWidth = referenceColumnWidth;
  middleRowIds.forEach((id, i) => {
    const w = middleWidths[i];
    if (id === referencePersonId) {
      referenceX = cursor;
      referenceSlotWidth = w;
    }
    placeNode(id, cursor + w / 2 - baseWidth(id) / 2, 0, false);
    cursor += w;
  });

  // Discendenti e ascendenti della persona di riferimento, centrati sulla sua colonna riservata
  // (referenceColumnWidth), non sulla riga centrale intera — così non collidono mai con i
  // fratelli, quale che sia la loro larghezza.
  const refColStart = referenceX + (referenceSlotWidth - referenceColumnWidth) / 2;
  const kids = descendantChildren.get(referencePersonId) ?? [];
  if (kids.length > 0) {
    const childWidths = kids.map((k) => descendantSubtreeWidth(k));
    const totalChildWidth = childWidths.reduce((a, b) => a + b, 0);
    let dCursor = refColStart + Math.max(0, (referenceColumnWidth - totalChildWidth) / 2);
    kids.forEach((k, i) => {
      const w = childWidths[i];
      placeDescendantSubtree(k, dCursor, dCursor + w, 1);
      dCursor += w;
    });
  }
  const parents = ascendantParents.get(referencePersonId) ?? [];
  if (parents.length > 0) {
    const parentWidths = parents.map((p) => ascendantSubtreeWidth(p));
    const totalParentWidth = parentWidths.reduce((a, b) => a + b, 0);
    let aCursor = refColStart + Math.max(0, (referenceColumnWidth - totalParentWidth) / 2);
    parents.forEach((p, i) => {
      const w = parentWidths[i];
      placeAscendantSubtree(p, aCursor, aCursor + w, -1);
      aCursor += w;
    });
  }

  const xs = nodes.map((n) => n.x);
  const generations = nodes.map((n) => n.generation);
  return {
    nodes,
    edges,
    minX: xs.length > 0 ? Math.min(...xs) : 0,
    maxX: xs.length > 0 ? Math.max(...xs) + 1 : 1,
    minGeneration: generations.length > 0 ? Math.min(...generations) : 0,
    maxGeneration: generations.length > 0 ? Math.max(...generations) : 0,
  };
}
