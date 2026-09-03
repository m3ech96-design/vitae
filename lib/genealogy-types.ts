/**
 * Modello dati dell'Albero Genealogico — nuovo, non riprende nulla del vecchio sistema di
 * parentela eliminato al Checkpoint 53 (né `lib/family-relations.ts`, né i campi
 * `fatherId`/`motherId`/`spouseId` un tempo su `Person`, tutti già rimossi e mai riusati qui).
 *
 * Decisione architetturale (confermata con l'utente prima di scrivere questo file):
 * persone e relazioni sono dati UNICI e CONDIVISI in tutto il modulo, non partizionati per
 * famiglia. Una "famiglia" (GenealogyFamily) non contiene le relazioni: è solo un segnalibro
 * — nome + persona di riferimento — che punta allo stesso grafo condiviso. Questo è ciò che
 * rende possibile il comportamento richiesto: aprire l'albero di una persona collegata (es.
 * la moglie di un figlio) sposta semplicemente il centro della vista, senza copiare, spostare
 * o duplicare alcuna relazione. Eliminare una famiglia cancella solo il segnalibro, mai le
 * persone o le relazioni sottostanti.
 *
 * Nessun automatismo sul testo delle relazioni (scelta esplicita dell'utente, dopo problemi
 * di sincronizzazione avuti in passato con versioni automatiche): ogni GenealogyRelationship
 * salva DUE tipi scelti a mano, uno per direzione — mai uno dedotto dall'altro. Vedi
 * lib/genealogy-relationship-types.ts per il catalogo dei tipi disponibili (estendibile) e il
 * loro ruolo grafico, l'unica automazione ammessa (dove disegnare un nodo, mai che testo
 * mostrare o quale relazione esiste).
 */

export interface GenealogyPerson {
  id: string;
  firstName: string;
  lastName: string;
  /** Stessa infrastruttura di image-store.ts già usata in tutta l'app (Persone, Animali,
   * Wishlist...) — non un sistema di foto a parte. */
  avatarKey?: string;
  /** Data di nascita/morte sempre parziale per scelta, come già `deceasedDay/Month/Year` su
   * Person in lib/types.ts: ognuno dei tre pezzi è facoltativo e indipendente — utile qui
   * ancora più che altrove, perché di un bisnonno spesso si conosce solo l'anno, o nulla. */
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  deathDay?: number;
  deathMonth?: number;
  deathYear?: number;
  /** Esplicito, non dedotto dalla presenza di una data di morte — puoi sapere che una persona
   * è deceduta senza conoscere quando. */
  alive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Una relazione tra due persone, indipendente dalle coordinate grafiche (che vivono solo nel
 * layout calcolato a runtime, mai salvate qui — vedi lib/genealogy-layout.ts). `personXId` e
 * `personYId` non hanno un ordine "corretto": sono semplicemente i due estremi. Il significato
 * sta nei due campi di tipo, ciascuno scritto a mano dall'utente, mai l'uno derivato dall'altro:
 *
 * - `typeIdForY` descrive Y rispetto a X — es. X=Mario, Y=Luca, tipo "figlio" → "Luca è il
 *   Figlio di Mario".
 * - `typeIdForX` descrive X rispetto a Y — scelto separatamente, anche se il tipo "naturale"
 *   sarebbe "padre": nessuna deduzione, l'utente lo sceglie comunque di persona.
 */
export interface GenealogyRelationship {
  id: string;
  personXId: string;
  personYId: string;
  typeIdForY: string;
  typeIdForX: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Un segnalibro, non un contenitore di dati — vedi la nota in cima al file. "Aprire una
 * famiglia" significa solo: mostra il grafo condiviso, centrato su `referencePersonId`.
 */
export interface GenealogyFamily {
  id: string;
  name: string;
  referencePersonId: string;
  createdAt: string;
  updatedAt: string;
}
