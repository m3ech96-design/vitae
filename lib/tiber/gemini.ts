import { TiberToolDeclaration } from "./tool-types";

/** Modello Flash del piano gratuito — vedi la nota nell'area vitae-assistente-ia sulla
 * scelta di partire da Gemini gratuito invece di una chiave a pagamento.
 *
 * Era "gemini-2.5-flash": Google l'ha ritirato per i nuovi utenti prima della data di
 * spegnimento annunciata (16 ottobre 2026) — un ritiro anticipato non annunciato, non un
 * problema di questo codice. Il messaggio d'errore di Google stesso indica il sostituto,
 * "gemini-3.6-flash": confermato compatibile con lo stesso endpoint REST generateContent
 * già in uso qui (stessa forma di richiesta — contents/systemInstruction/tools — nessun'
 * altra modifica necessaria), disponibile anch'esso nel piano gratuito di AI Studio senza
 * carta di credito. Le richieste gratuite giornaliere concesse ai modelli Flash "pieni"
 * come questo sono però più basse di quanto fossero su 2.5 Flash — se Tiber dovesse
 * rispondere con un errore 429 "limite raggiunto" più spesso di prima, è per questo, non
 * per un problema del codice: un'eventuale chiave a pagamento (bastano pochi centesimi per
 * conversazione) alzerebbe di molto quel tetto. */
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiTurnResult {
  /** Testo scritto dal modello in questo turno — può convivere con una o più function call
   * (Gemini a volte accompagna una chiamata con una frase, a volte no). */
  text: string;
  functionCalls: GeminiFunctionCall[];
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
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
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: history,
    tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
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
    try {
      googleMessage = JSON.parse(errText)?.error?.message ?? "";
    } catch {
      // corpo non JSON: si userà errText grezzo più sotto
    }
    if (res.status === 429) {
      throw new Error("Limite di richieste del piano gratuito Gemini raggiunto per ora — riprova tra poco o domani.");
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
      functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args ?? {} });
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
  for (const fc of functionCalls) parts.push({ functionCall: { name: fc.name, args: fc.args } });
  return { role: "model", parts };
}

export function functionResponseTurn(results: { name: string; result: string }[]): GeminiContent {
  return {
    role: "user",
    parts: results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.result } } })),
  };
}
