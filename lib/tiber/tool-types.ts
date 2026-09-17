/**
 * Forma comune di ogni tool che Tiber può chiamare. Il modello Gemini riceve la lista di
 * `declaration` (nome, descrizione, schema parametri in formato OpenAPI-lite, come richiesto
 * dall'API Gemini per il function calling) e decide se e quando invocarli; `execute` è la
 * funzione vera, eseguita lato client con accesso diretto ai context già montati nell'app —
 * Tiber non ha un canale separato verso i dati, usa le stesse funzioni che ogni scheda
 * dell'app chiama quando l'utente tocca un bottone.
 */
export interface TiberToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface TiberToolDefinition {
  declaration: TiberToolDeclaration;
  /** Fascia distruttiva (cancellazioni, prelievi di denaro, eliminazione di persone/animali)
   * — l'unica per cui l'autonomia "completa" scelta dall'utente si ferma un istante per un
   * "Sei sicuro?" prima di eseguire davvero. Assente/false per tutto il resto: eseguito
   * subito, senza alcuna conferma. */
  destructive?: boolean;
  /** Esegue l'azione vera sui dati dell'app — riceve gli argomenti già validati dal modello
   * e un riferimento a tutti i context disponibili (vedi TiberContextBundle in registry.ts).
   * Ritorna una breve frase di esito, mostrata sotto il messaggio in chat. */
  execute: (args: Record<string, unknown>, ctx: TiberExecutionContext) => string | Promise<string>;
}

/** Tutti i context di cui i tool hanno bisogno per agire — passato a ogni `execute` invece di
 * far leggere ai tool gli hook React direttamente (i tool non sono componenti, vivono dentro
 * la pagina di Tiber che li assembla una volta con tutti gli hook già chiamati). */
export type TiberExecutionContext = Record<string, unknown>;

/** Piccolo helper per accedere a un campo del bundle con un cast leggibile, invece di
 * ripetere `as any` ovunque nei singoli file di tool. */
export function ctxField<T>(ctx: TiberExecutionContext, key: string): T {
  return ctx[key] as T;
}
