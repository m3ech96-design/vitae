import { TiberToolDeclaration } from "./tool-types";

/** Modello Flash del piano gratuito — vedi la nota nell'area vitae-assistente-ia sulla
 * scelta di partire da Gemini gratuito invece di una chiave a pagamento.
 *
 * Passato da "gemini-3.6-flash" a "gemini-3.5-flash-lite" su richiesta esplicita: il
 * "pensiero" interno di 3.6 Flash non serve per come Tiber viene usato qui (chiamare tool,
 * rispondere a domande dirette), mentre il tetto gratuito giornaliero di Flash-Lite è molto
 * più alto (~500 richieste/giorno contro ~20) — decisivo dato che ogni messaggio a Tiber può
 * già scatenare 2-3 chiamate in sequenza nel ciclo di function calling qui sotto. */
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
  /** "Firma" opaca che Gemini 3.x allega alla PRIMA functionCall di ogni turno (le
   * eventuali altre, se il modello ne propone più di una in parallelo, restano senza) — va
   * rimandata indietro identica, nello stesso punto, quando si ripropone la cronologia in
   * una richiesta successiva. Trovato l'errore preciso ("Function call is missing a
   * thought_signature") solo dopo essere passati a un modello 3.x (checkpoint 124): i
   * modelli 2.x precedenti non la richiedevano affatto, per questo non c'era già. */
  thoughtSignature?: string;
}

export interface GeminiTurnResult {
  /** Testo scritto dal modello in questo turno — può convivere con una o più function call
   * (Gemini a volte accompagna una chiamata con una frase, a volte no). */
  text: string;
  functionCalls: GeminiFunctionCall[];
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/**
 * Una singola chiamata a generateContent — SENZA il ciclo di esecuzione tool, che vive nel
 * context (vedi context.tsx): questa funzione fa solo la richiesta HTTP e restituisce cosa
 * ha risposto il modello in QUESTO turno, lasciando a chi chiama la decisione se eseguire le
 * function call e richiamare di nuovo.
 *
 * Chiamata direttamente dal browser verso Google, senza alcun server nel mezzo — Vitae non
 * ha un backend proprio (vedi la nota sulla scelta della chiave in localStorage): stessa
 * scelta architetturale di tutte le altre chiamate esterne dirette dell'app dove non serve
 * aggirare un CORS (qui Google li supporta per chiamate autenticate da browser).
 */
export async function callGemini(
  apiKey: string,
  systemInstruction: string,
  history: GeminiContent[],
  tools: TiberToolDeclaration[]
): Promise<GeminiTurnResult> {
  // Due voci separate nell'array, non un'unica voce con entrambe le chiavi — è la forma
  // richiesta dalla API per combinare un tool integrato (la ricerca web) con tool
  // personalizzati nella stessa richiesta, confermata compatibile con i modelli Gemini 3.x
  // (non lo era con le generazioni precedenti). Concede a Tiber la possibilità di cercare
  // sul web di sua iniziativa — un ristorante ben valutato vicino a una posizione, notizie
  // su un libro appena aggiunto, un negozio nei dintorni — senza una chiave o un servizio
  // separati: 5.000 ricerche gratuite al mese sono incluse nello stesso piano gratuito già
  // in uso, un tetto che per un solo utilizzatore personale è praticamente enorme.
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: history,
    tools: [...(tools.length > 0 ? [{ functionDeclarations: tools }] : []), { googleSearch: {} }],
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Il corpo d'errore di Google è quasi sempre JSON con un `error.message` leggibile —
    // usarlo alla lettera invece di indovinare la causa dal solo status HTTP evita di
    // diagnosticare male l'errore sbagliato (è già successo: un 400 dovuto a un formato
    // scorretto nella richiesta — non alla chiave — veniva prima etichettato come "chiave
    // non valida", mandando a controllare inutilmente qualcosa che era già corretto).
    let googleMessage = "";
    // Per un 429 il messaggio sopra è spesso solo il testo generico ("hai superato la quota
    // attuale...") — non sempre dice da solo se è per minuto (transitorio, secondi) o per
    // giorno (persiste per ore). Quando c'è, quel dettaglio vive altrove nel corpo, dentro
    // error.details[]: un QuotaFailure con `quotaId` (quale limite esatto) e/o un RetryInfo
    // con `retryDelay` (quanto aspettare, in secondi, detto esplicitamente da Google) — mai
    // letti finora, per questo il messaggio mostrato non cambiava mai in base al caso vero.
    let quotaId = "";
    let retryDelay = "";
    try {
      const parsed = JSON.parse(errText);
      googleMessage = parsed?.error?.message ?? "";
      const details: { violations?: { quotaId?: string }[]; retryDelay?: string }[] = parsed?.error?.details ?? [];
      quotaId = details
        .flatMap((d) => d.violations ?? [])
        .map((v) => v.quotaId)
        .filter(Boolean)
        .join(", ");
      retryDelay = details.find((d) => d.retryDelay)?.retryDelay ?? "";
    } catch {
      // corpo non JSON: si userà errText grezzo più sotto
    }
    // Un secondo posto in cui Google può indicare l'attesa, indipendente dal corpo JSON —
    // l'header HTTP standard per i 429, mai controllato finora (si guardava solo il corpo).
    const retryAfterHeader = res.headers.get("retry-after") ?? "";

    if (res.status === 429) {
      const waitHint = retryDelay || (retryAfterHeader ? `${retryAfterHeader}s` : "");
      const parts = [quotaId, googleMessage, waitHint ? `Attesa suggerita: ${waitHint}.` : ""].filter(Boolean);
      throw new Error(`Limite di richieste Gemini raggiunto (429)${parts.length > 0 ? `: ${parts.join(" — ")}` : " — dettaglio non disponibile nella risposta."}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Chiave Gemini non valida o senza permessi${googleMessage ? `: ${googleMessage}` : ""}`);
    }
    throw new Error(`Errore da Gemini (${res.status})${googleMessage ? `: ${googleMessage}` : `: ${errText.slice(0, 200)}`}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts: GeminiPart[] = candidate?.content?.parts ?? [];

  let text = "";
  const functionCalls: GeminiFunctionCall[] = [];
  for (const part of parts) {
    if ("text" in part && part.text) text += part.text;
    if ("functionCall" in part && part.functionCall) {
      functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args ?? {}, thoughtSignature: part.thoughtSignature });
    }
  }

  return { text, functionCalls };
}

export function userTurn(text: string): GeminiContent {
  return { role: "user", parts: [{ text }] };
}

export function modelTurn(text: string, functionCalls: GeminiFunctionCall[]): GeminiContent {
  const parts: GeminiPart[] = [];
  if (text) parts.push({ text });
  for (const fc of functionCalls) {
    parts.push({
      functionCall: { name: fc.name, args: fc.args },
      ...(fc.thoughtSignature ? { thoughtSignature: fc.thoughtSignature } : {}),
    });
  }
  return { role: "model", parts };
}

export function functionResponseTurn(results: { name: string; result: string }[]): GeminiContent {
  return {
    role: "user",
    parts: results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.result } } })),
  };
}
