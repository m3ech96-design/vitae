"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { newId } from "@/lib/id";
import { TiberMessage, TiberToolCall } from "./types";
import { TIBER_TOOLS, tiberToolDeclarations } from "./registry";
import { TiberExecutionContext } from "./tool-types";
import { callGemini, userTurn, modelTurn, functionResponseTurn, GeminiFunctionCall } from "./gemini";

/** Prefisso deliberatamente diverso da "vitae:" — il backup dell'app (lib/backup.ts) salva
 * automaticamente TUTTO ciò che inizia per "vitae:", senza eccezioni verificate: la chiave
 * Gemini non deve mai finire in un file di backup esportato o condiviso, quindi vive sotto un
 * prefisso che quel meccanismo non tocca per costruzione, non per un'eccezione fragile. */
const API_KEY_STORAGE = "tiber-secret:gemini-api-key";
const MESSAGES_KEY = "vitae:tiber-messages";

const SYSTEM_INSTRUCTION = `Sei Tiber, il maggiordomo digitale dell'app Vitae. Parli in italiano, con un tono cordiale, diretto e un po' British — mai servile, mai eccessivamente entusiasta.
Hai accesso a un ampio catalogo di azioni sui dati personali dell'utente (task, finanze, alimentazione, salute, animali, rapporti, luoghi, hobby, wishlist, diario, stato d'animo, attività fisica) tramite i tool che ti vengono forniti.
Usa i tool ogni volta che l'utente ti chiede di fare, aggiungere, modificare o consultare qualcosa che rientra in una di queste aree — non limitarti a spiegare come farlo, fallo davvero chiamando il tool giusto.
Se un tool restituisce un errore o non trova qualcosa, dillo chiaramente invece di inventare un risultato.
Rispondi in modo conciso, come farebbe un maggiordomo efficiente: poche frasi, dirette al punto, senza premesse superflue.`;

interface TiberContextValue {
  hydrated: boolean;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  messages: TiberMessage[];
  sending: boolean;
  error: string | null;
  /** Azione della fascia distruttiva in attesa di conferma "Sei sicuro?" — al più una alla
   * volta: se il modello proponesse più azioni distruttive nello stesso turno, si confermano
   * in sequenza, mai tutte insieme silenziosamente. */
  pendingConfirmation: { messageId: string; toolCall: TiberToolCall } | null;
  sendMessage: (text: string) => Promise<void>;
  confirmPendingAction: () => Promise<void>;
  cancelPendingAction: () => void;
  clearConversation: () => void;
}

const TiberContext = createContext<TiberContextValue | null>(null);

export function TiberProvider({
  children,
  executionContext,
}: {
  children: React.ReactNode;
  /** Bundle di tutti i context dell'app di cui i tool hanno bisogno — assemblato una volta
   * nella pagina di Tiber (vedi tiber/execution-bundle.ts), dopo che tutti gli hook React
   * necessari sono già stati chiamati lì. */
  executionContext: TiberExecutionContext;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [messages, setMessages] = useState<TiberMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ messageId: string; toolCall: TiberToolCall } | null>(null);

  // Tenuto sempre fresco tramite ref, come lo stesso pattern già usato altrove nell'app
  // (vedi use-notification-polling.ts) — evita di dover ricreare le callback che lo usano a
  // ogni render quando cambia un dato qualunque di un context a valle.
  const execCtxRef = useRef(executionContext);
  execCtxRef.current = executionContext;

  useEffect(() => {
    try {
      const rawKey = window.localStorage.getItem(API_KEY_STORAGE);
      if (rawKey) setApiKeyState(rawKey);
      const rawMessages = window.localStorage.getItem(MESSAGES_KEY);
      if (rawMessages) setMessages(JSON.parse(rawMessages));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persistMessages = useCallback((updater: TiberMessage[] | ((prev: TiberMessage[]) => TiberMessage[])) => {
    setMessages((prev) => {
      const next = typeof updater === "function" ? (updater as (v: TiberMessage[]) => TiberMessage[])(prev) : updater;
      try {
        window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    try {
      if (key) window.localStorage.setItem(API_KEY_STORAGE, key);
      else window.localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // ignorato
    }
  }, []);

  /** Converte la cronologia messaggi già salvata nel formato Gemini (contents), per dare al
   * modello memoria delle battute precedenti — non solo dell'ultimo messaggio. */
  /** Converte la cronologia messaggi già salvata nel formato Gemini (contents), per dare al
   * modello memoria delle battute precedenti — non solo dell'ultimo messaggio.
   *
   * Per un messaggio dell'assistente che ha chiamato dei tool, non basta riproporre la sola
   * `functionCall`: Gemini si aspetta che ogni chiamata sia sempre seguita dalla propria
   * `functionResponse` nel turno successivo — è così che la struttura della conversazione
   * resta valida quando la si ricostruisce da capo per un nuovo messaggio, non solo nel giro
   * di andata e ritorno immediato dentro la stessa chiamata a sendMessage. Se un'azione
   * distruttiva è ancora in attesa di conferma (result assente), si usa un esito
   * segnaposto: senza, quella functionCall resterebbe orfana e romperebbe la struttura.
   */
  function historyToGemini(msgs: TiberMessage[]) {
    const contents: ReturnType<typeof userTurn>[] = [];
    for (const m of msgs) {
      if (m.role === "tool") continue;
      if (m.role === "user") {
        contents.push(userTurn(m.text));
        continue;
      }
      const calls = m.toolCalls ?? [];
      contents.push(modelTurn(m.text, calls.map((tc) => ({ name: tc.toolName, args: tc.args }))));
      if (calls.length > 0) {
        contents.push(functionResponseTurn(calls.map((tc) => ({ name: tc.toolName, result: tc.result ?? "In attesa di conferma dell'utente." }))));
      }
    }
    return contents;
  }

  /** Esegue davvero un tool (mai per la fascia distruttiva non ancora confermata) e
   * restituisce la frase di esito da mostrare e da rimandare al modello. */
  async function runTool(call: GeminiFunctionCall): Promise<string> {
    const tool = TIBER_TOOLS[call.name];
    if (!tool) return `Tool sconosciuto: ${call.name}.`;
    try {
      return await tool.execute(call.args, execCtxRef.current);
    } catch (e) {
      return `Errore nell'eseguire ${call.name}: ${e instanceof Error ? e.message : "errore sconosciuto"}.`;
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!apiKey) {
        setError("Manca la chiave API di Gemini — impostala per parlare con Tiber.");
        return;
      }
      setError(null);
      setSending(true);

      const userMsg: TiberMessage = { id: newId(), role: "user", text, createdAt: new Date().toISOString() };
      let workingMessages: TiberMessage[] = [];
      persistMessages((prev) => {
        workingMessages = [...prev, userMsg];
        return workingMessages;
      });

      try {
        let history = [...historyToGemini(workingMessages)];
        let guard = 0;
        // Ciclo multi-turno: il modello può incatenare più chiamate tool prima di rispondere
        // in chiaro — 6 giri come tetto di sicurezza contro un loop infinito lato modello,
        // ampiamente sufficiente per qualunque richiesta composita ragionevole.
        while (guard < 6) {
          guard += 1;
          const turn = await callGemini(apiKey, SYSTEM_INSTRUCTION, history, tiberToolDeclarations());

          if (turn.functionCalls.length === 0) {
            const assistantMsg: TiberMessage = {
              id: newId(),
              role: "assistant",
              text: turn.text || "Fatto.",
              createdAt: new Date().toISOString(),
            };
            persistMessages((prev) => [...prev, assistantMsg]);
            break;
          }

          // Se almeno una delle chiamate proposte in questo turno è distruttiva, ci si ferma
          // qui: si mostra il messaggio con quella call in sospeso e si aspetta la conferma
          // dell'utente invece di eseguirla ed eventualmente proseguire il ciclo da sola.
          const destructiveCall = turn.functionCalls.find((fc) => TIBER_TOOLS[fc.name]?.destructive);
          if (destructiveCall) {
            const toolCall: TiberToolCall = {
              id: newId(),
              toolName: destructiveCall.name,
              args: destructiveCall.args,
              needsConfirmation: true,
            };
            const assistantMsg: TiberMessage = {
              id: newId(),
              role: "assistant",
              text: turn.text,
              toolCalls: [toolCall],
              createdAt: new Date().toISOString(),
            };
            persistMessages((prev) => [...prev, assistantMsg]);
            setPendingConfirmation({ messageId: assistantMsg.id, toolCall });
            break;
          }

          // Fascia normale: autonomia completa, eseguite subito senza alcuna conferma.
          const results = await Promise.all(
            turn.functionCalls.map(async (fc) => ({ name: fc.name, result: await runTool(fc) }))
          );
          const toolCalls: TiberToolCall[] = turn.functionCalls.map((fc, i) => ({
            id: newId(),
            toolName: fc.name,
            args: fc.args,
            result: results[i].result,
          }));
          const assistantMsg: TiberMessage = {
            id: newId(),
            role: "assistant",
            text: turn.text,
            toolCalls,
            createdAt: new Date().toISOString(),
          };
          persistMessages((prev) => [...prev, assistantMsg]);

          history = [...history, modelTurn(turn.text, turn.functionCalls), functionResponseTurn(results)];
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore di comunicazione con Tiber.");
      } finally {
        setSending(false);
      }
    },
    [apiKey, persistMessages]
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingConfirmation) return;
    const { messageId, toolCall } = pendingConfirmation;
    setPendingConfirmation(null);
    setSending(true);
    const tool = TIBER_TOOLS[toolCall.toolName];
    const result = tool ? await runTool({ name: toolCall.toolName, args: toolCall.args }) : "Tool sconosciuto.";
    persistMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, toolCalls: (m.toolCalls ?? []).map((tc) => (tc.id === toolCall.id ? { ...tc, result, confirmed: true } : tc)) }
          : m
      )
    );
    setSending(false);
  }, [pendingConfirmation, persistMessages]);

  const cancelPendingAction = useCallback(() => {
    if (!pendingConfirmation) return;
    const { messageId, toolCall } = pendingConfirmation;
    persistMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolCalls: (m.toolCalls ?? []).map((tc) =>
                tc.id === toolCall.id ? { ...tc, result: "Annullato.", confirmed: false } : tc
              ),
            }
          : m
      )
    );
    setPendingConfirmation(null);
  }, [pendingConfirmation, persistMessages]);

  const clearConversation = useCallback(() => {
    persistMessages([]);
    setPendingConfirmation(null);
    setError(null);
  }, [persistMessages]);

  const value: TiberContextValue = {
    hydrated,
    apiKey,
    setApiKey,
    messages,
    sending,
    error,
    pendingConfirmation,
    sendMessage,
    confirmPendingAction,
    cancelPendingAction,
    clearConversation,
  };

  return <TiberContext.Provider value={value}>{children}</TiberContext.Provider>;
}

export function useTiber(): TiberContextValue {
  const ctx = useContext(TiberContext);
  if (!ctx) throw new Error("useTiber va usato dentro un TiberProvider");
  return ctx;
}
