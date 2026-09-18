/**
 * Tipi condivisi del maggiordomo "Tiber" — l'assistente conversazionale di Vitae che legge lo
 * stato dell'app e può agire sui suoi dati tramite un catalogo di "tool" (vedi tools.ts),
 * chiamati da un modello Gemini con function calling (vedi gemini.ts).
 *
 * Autonomia scelta dall'utente: Tiber esegue da solo qualunque azione i tool permettano —
 * l'unica eccezione è la fascia "distruttiva" (cancellazioni, prelievi di denaro, eliminazione
 * di persone/animali), per cui basta una conferma "Sei sicuro?" prima di eseguire, non una
 * revisione del dettaglio dell'azione.
 */

export type TiberRole = "user" | "assistant" | "tool";

/** Una singola chiamata a un tool fatta da Tiber durante un turno — registrata nel messaggio
 * per poter mostrare in chat cosa ha fatto, non solo cosa ha detto. */
export interface TiberToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  /** "Firma" opaca che Gemini allega alla chiamata — va conservata e rimandata indietro
   * identica quando questo messaggio viene riproposto nella cronologia di una richiesta
   * successiva (vedi gemini.ts e historyToGemini in context.tsx). Assente per i modelli
   * precedenti a Gemini 3.x, che non la richiedevano. */
  thoughtSignature?: string;
  /** Esito dell'esecuzione — testo breve mostrato sotto il messaggio ("Task creata", "Spesa
   * di 12€ aggiunta"...). Assente finché la chiamata è ancora in attesa di conferma
   * (azione distruttiva non ancora confermata). */
  result?: string;
  /** true solo per le azioni della fascia distruttiva — pilota il prompt "Sei sicuro?" in
   * TiberMessageBubble prima che il tool venga davvero eseguito. */
  needsConfirmation?: boolean;
  confirmed?: boolean;
}

export interface TiberMessage {
  id: string;
  role: TiberRole;
  text: string;
  toolCalls?: TiberToolCall[];
  createdAt: string;
  /** true solo per un commento nato da un momento di riflessione spontanea (vedi
   * triggerReflection in context.tsx), mai per una risposta a un messaggio scritto
   * dall'utente — pilota un'etichetta discreta in TiberMessageBubble e la bolla flottante
   * globale, non un ruolo diverso: resta comunque un messaggio "assistant" a tutti gli
   * effetti nella cronologia mandata a Gemini. */
  proactive?: boolean;
  /** true solo per un messaggio "user" nato da una registrazione vocale (vedi
   * sendVoiceMessage in context.tsx) — mai per l'assistente. `text` in questo caso non è mai
   * una trascrizione: contiene sempre la stessa etichetta fissa "🎤 Messaggio vocale" (scelta
   * esplicita: l'audio vero va a Gemini una volta sola, nel turno in cui viene registrato, non
   * viene ritrascritto né riproposto nei turni successivi). Pilota solo la resa in chat, non
   * la cronologia mandata a Gemini, che riusa lo stesso campo `text` per entrambi i casi. */
  voice?: boolean;
}

/** Una singola azione che un tool può proporre — usata sia per eseguire subito (fascia
 * normale) sia per restare in sospeso fino alla conferma (fascia distruttiva). */
export interface PendingToolAction {
  toolCall: TiberToolCall;
  messageId: string;
}
