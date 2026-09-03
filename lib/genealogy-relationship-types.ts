/**
 * Il catalogo dei tipi di parentela — la lista che compare in ogni selettore "che tipo di
 * relazione". Estendibile davvero: aggiungere un tipo qui (o dall'interfaccia, vedi
 * lib/genealogy-context.tsx per i tipi personalizzati salvati) non richiede toccare il
 * database né la logica dell'albero, perché ogni GenealogyRelationship salva l'id del tipo,
 * mai il tipo stesso — rinominare un'etichetta, o aggiungerne una nuova, non tocca alcun dato
 * già salvato.
 *
 * `layoutRole` è l'UNICA informazione che il sistema ricava da un tipo di parentela, e serve
 * solo a decidere DOVE disegnare il nodo (sopra, sotto, di fianco) — mai quale testo mostrare
 * (quello è sempre e solo l'etichetta scritta qui) né a dedurre relazioni nuove. È la sola
 * automazione ammessa secondo le istruzioni originali ("l'unica automazione ammessa è quella
 * necessaria a disporre graficamente i nodi").
 *
 * Nessun campo "reciproco": scelta esplicita dell'utente, dopo problemi di sincronizzazione
 * avuti in passato con versioni automatiche — ogni relazione salva entrambe le direzioni a
 * mano (vedi GenealogyRelationship), indipendentemente da questo catalogo.
 */

export type GenealogyLayoutRole = "ascendant" | "descendant" | "sibling" | "partner" | "other";

export interface GenealogyRelationshipType {
  /** Stabile per sempre — è questo, non l'etichetta, che ogni relazione salva. Rinominare
   * l'etichetta di un tipo non rompe nulla di già salvato. */
  id: string;
  label: string;
  layoutRole: GenealogyLayoutRole;
  /** I tipi di serie non si possono eliminare (romperebbe le relazioni che li usano), solo
   * nascondere dal selettore — vedi hiddenBuiltInIds in genealogy-context.tsx. I tipi
   * personalizzati invece si eliminano per davvero, ma solo se nessuna relazione li usa più. */
  builtIn: boolean;
  /** Solo per la resa grafica della linea (punto 7 delle istruzioni: distinguere anche le
   * relazioni adottive da quelle biologiche, non solo genitore/figlio, coppia e fratelli) —
   * mai un'informazione dedotta: il tipo stesso, scelto a mano dall'utente, già lo dice. Le
   * relazioni "biologiche" sono lo stile di default (linea piena) e non serve marcarle a
   * parte; solo le adottive ricevono un tratteggio distintivo. */
  visualEmphasis?: "adoptive";
}

/**
 * La lista di serie, dal punto 3 delle istruzioni originali — completa così com'era scritta,
 * più il ruolo grafico che le istruzioni chiedevano di dedurre per la sola disposizione.
 * "Nipote" è per costruzione ambiguo in italiano (nipote di nonno o nipote di zio): scelto qui
 * come discendente (nipote-di-nonno, coerente con lo schema NONNI/GENITORI/.../NIPOTI delle
 * istruzioni) — chi intende l'altro significato può cambiargli ruolo grafico dalle
 * impostazioni del catalogo, o creare un tipo personalizzato "Nipote (di zio)".
 */
export const BUILT_IN_RELATIONSHIP_TYPES: GenealogyRelationshipType[] = [
  { id: "padre", label: "Padre", layoutRole: "ascendant", builtIn: true },
  { id: "madre", label: "Madre", layoutRole: "ascendant", builtIn: true },
  { id: "figlio", label: "Figlio", layoutRole: "descendant", builtIn: true },
  { id: "figlia", label: "Figlia", layoutRole: "descendant", builtIn: true },
  { id: "fratello", label: "Fratello", layoutRole: "sibling", builtIn: true },
  { id: "sorella", label: "Sorella", layoutRole: "sibling", builtIn: true },
  { id: "nonno", label: "Nonno", layoutRole: "ascendant", builtIn: true },
  { id: "nonna", label: "Nonna", layoutRole: "ascendant", builtIn: true },
  { id: "nipote", label: "Nipote", layoutRole: "descendant", builtIn: true },
  { id: "zio", label: "Zio", layoutRole: "other", builtIn: true },
  { id: "zia", label: "Zia", layoutRole: "other", builtIn: true },
  { id: "cugino", label: "Cugino", layoutRole: "other", builtIn: true },
  { id: "cugina", label: "Cugina", layoutRole: "other", builtIn: true },
  { id: "marito", label: "Marito", layoutRole: "partner", builtIn: true },
  { id: "moglie", label: "Moglie", layoutRole: "partner", builtIn: true },
  { id: "partner", label: "Partner", layoutRole: "partner", builtIn: true },
  { id: "compagno", label: "Compagno", layoutRole: "partner", builtIn: true },
  { id: "compagna", label: "Compagna", layoutRole: "partner", builtIn: true },
  { id: "patrigno", label: "Patrigno", layoutRole: "ascendant", builtIn: true },
  { id: "matrigna", label: "Matrigna", layoutRole: "ascendant", builtIn: true },
  { id: "figliastro", label: "Figliastro", layoutRole: "descendant", builtIn: true },
  { id: "figliastra", label: "Figliastra", layoutRole: "descendant", builtIn: true },
  { id: "suocero", label: "Suocero", layoutRole: "ascendant", builtIn: true },
  { id: "suocera", label: "Suocera", layoutRole: "ascendant", builtIn: true },
  { id: "genero", label: "Genero", layoutRole: "descendant", builtIn: true },
  { id: "nuora", label: "Nuora", layoutRole: "descendant", builtIn: true },
  { id: "cognato", label: "Cognato", layoutRole: "sibling", builtIn: true },
  { id: "cognata", label: "Cognata", layoutRole: "sibling", builtIn: true },
  { id: "padre-adottivo", label: "Padre adottivo", layoutRole: "ascendant", builtIn: true, visualEmphasis: "adoptive" },
  { id: "madre-adottiva", label: "Madre adottiva", layoutRole: "ascendant", builtIn: true, visualEmphasis: "adoptive" },
  { id: "figlio-adottivo", label: "Figlio adottivo", layoutRole: "descendant", builtIn: true, visualEmphasis: "adoptive" },
  { id: "figlia-adottiva", label: "Figlia adottiva", layoutRole: "descendant", builtIn: true, visualEmphasis: "adoptive" },
  { id: "padre-biologico", label: "Padre biologico", layoutRole: "ascendant", builtIn: true },
  { id: "madre-biologica", label: "Madre biologica", layoutRole: "ascendant", builtIn: true },
  { id: "fratello-adottivo", label: "Fratello adottivo", layoutRole: "sibling", builtIn: true, visualEmphasis: "adoptive" },
  { id: "sorella-adottiva", label: "Sorella adottiva", layoutRole: "sibling", builtIn: true, visualEmphasis: "adoptive" },
  { id: "fratellastro", label: "Fratellastro", layoutRole: "sibling", builtIn: true },
  { id: "sorellastra", label: "Sorellastra", layoutRole: "sibling", builtIn: true },
  { id: "ex-marito", label: "Ex marito", layoutRole: "partner", builtIn: true },
  { id: "ex-moglie", label: "Ex moglie", layoutRole: "partner", builtIn: true },
  { id: "ex-partner", label: "Ex partner", layoutRole: "partner", builtIn: true },
  { id: "altro", label: "Altro", layoutRole: "other", builtIn: true },
];
