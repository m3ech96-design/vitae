export type WidgetSize = "square" | "half" | "full";

export interface PlacedWidget {
  id: string; // id dell'istanza piazzata (non del catalogo — permette in teoria più copie, anche se oggi il vincolo "niente doppioni" ne impedisce due dello stesso tipo)
  widgetId: string; // chiave nel catalogo, vedi lib/widgets/registry.tsx
  size: WidgetSize;
}

export interface WidgetCatalogEntry {
  id: string;
  title: string;
  /** Per raggruppare il catalogo quando lo sfogli — "Task", "Finanze", "Trasversali"... */
  category: string;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
  /** Dove porta un tocco sulla card (non una pressione lunga, che resta per le azioni del
   * widget stesso) — la scheda/pagina a cui appartiene il dato mostrato. Assente solo per i
   * pochi widget la cui "funzione" è già interamente qui (es. il messaggio rapido alla casa):
   * per quelli non ha senso portare altrove, la card stessa è già la destinazione. */
  href?: string;
  /** Il componente vero, che riceve la taglia CORRENTE (l'utente può ridimensionare dopo
   * averlo piazzato) e decide da solo quanto mostrare — un quadrato non mostra le stesse
   * informazioni di una mezza larghezza, mai la stessa vista rimpicciolita. */
  Component: React.ComponentType<{ size: WidgetSize }>;
}
