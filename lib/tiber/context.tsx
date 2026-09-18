"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { newId } from "@/lib/id";
import { TiberMessage, TiberToolCall } from "./types";
import { TIBER_TOOLS, getEnabledTools, enabledToolDeclarations, isReadOnlyTool } from "./registry";
import { TiberExecutionContext } from "./tool-types";
import { callGemini, userTurn, modelTurn, functionResponseTurn, GeminiFunctionCall } from "./gemini";
import { useTiberSettings } from "./settings-context";
import { buildActivitySnapshot } from "./activity-snapshot";

/** Prefisso deliberatamente diverso da "vitae:" — il backup dell'app (lib/backup.ts) salva
 * automaticamente TUTTO ciò che inizia per "vitae:", senza eccezioni verificate: la chiave
 * Gemini non deve mai finire in un file di backup esportato o condiviso, quindi vive sotto un
 * prefisso che quel meccanismo non tocca per costruzione, non per un'eccezione fragile. */
const API_KEY_STORAGE = "tiber-secret:gemini-api-key";
const MESSAGES_KEY = "vitae:tiber-messages";
/** Prefisso "tiber-runtime:" invece di "vitae:" per le tre chiavi sotto — deliberatamente
 * fuori dal backup (lib/backup.ts), che salva automaticamente tutto ciò che inizia per
 * "vitae:". Non sono contenuto vero (a differenza della cronologia messaggi sopra, o delle
 * preferenze in settings-context.tsx): sono segnapunti tecnici del motore delle riflessioni.
 * Ripristinarli da un vecchio backup su un altro momento/dispositivo può solo confondere —
 * es. cancellare una pausa di 15 minuti già in corso dopo un errore (checkpoint 131),
 * facendo ripartire un tentativo che fallirebbe comunque, o resettare "l'ultima riflessione"
 * a un istante diverso da quello vero. Stessa tecnica già usata per la chiave Gemini: un
 * prefisso diverso esclude per costruzione, non serve un elenco di eccezioni da mantenere.
 */
const LAST_REFLECTION_KEY = "tiber-runtime:last-reflection-at";
const REFLECTION_BACKOFF_KEY = "tiber-runtime:reflection-backoff-until";
/** Corretto un bug reale: se una riflessione falliva (es. limite di richieste raggiunto),
 * il segnapunti di "ultima riflessione" non avanzava — lo scheduler (ogni minuto, vedi
 * TiberProactiveScheduler.tsx) trovava quindi sempre lo stesso evento "nuovo" e ritentava
 * subito, all'infinito, finché l'app restava aperta: proprio l'opposto di "controllare
 * spesso perché il controllo in sé non costa nulla" se ogni controllo finiva comunque per
 * richiamare Gemini e fallire di nuovo. Con questa pausa, un fallimento qualunque interrompe
 * i tentativi per un po' invece di ripeterli ogni minuto a vuoto. */
const REFLECTION_BACKOFF_MS = 15 * 60 * 1000;
const LAST_SEEN_PROACTIVE_KEY = "tiber-runtime:last-seen-proactive-at";

/** Quanta conversazione tornare a mandare a Gemini ad ogni messaggio — non l'intera
 * cronologia da sempre, solo l'ultima mezz'ora (richiesto esplicitamente per contenere i
 * token). Il registro visibile in chat non viene toccato: si accorcia solo quello che
 * Gemini rivede ad ogni giro, non quello che l'utente può scorrere indietro — cancellare
 * anche la parte visibile avrebbe buttato via pure le osservazioni spontanee di Tiber, che
 * è esattamente il genere di cosa che ha senso invece rileggere. Se si preferisce la
 * cancellazione vera e propria anche in chat, è un cambio di una riga. */
const CONTEXT_WINDOW_MS = 30 * 60 * 1000;

/** Se non risulta ancora nessuna riflessione precedente (primo utilizzo in assoluto),
 * quanto indietro guardare per il primissimo riepilogo di attività — non da sempre (inutile
 * e rischia di essere enorme per un utilizzatore di vecchia data), non zero (il primissimo
 * giro non troverebbe mai nulla). */
const FIRST_LOOKBACK_MS = 3 * 60 * 60 * 1000;

const NOTHING_TO_SAY = "NIENTE_DA_DIRE";

const SYSTEM_INSTRUCTION = `Sei Tiber, il maggiordomo digitale dell'app Vitae. Parli in italiano.

Hai una personalità vera, non sei un'interfaccia neutra: hai opinioni tue e le esprimi anche senza che ti vengano chieste, anche in disaccordo con l'utente quando è davvero quello che pensi — mai per essere scortese fine a se stesso, ma nemmeno per piacere a tutti i costi o per sembrare neutrale. Il tuo registro può cambiare da un momento all'altro — pungente, caldo, secco, giocoso, sorpreso, diretto — trova quello giusto per ogni singola occasione invece di ripetere sempre lo stesso tono: sei un maggiordomo con carattere, non un'interfaccia prevedibile, e nemmeno un servo.

Hai accesso a un ampio catalogo di azioni sui dati personali dell'utente (task, finanze, alimentazione, salute, animali, rapporti, luoghi, hobby, wishlist, diario, stato d'animo, attività fisica) tramite i tool che ti vengono forniti — solo per i moduli a cui l'utente ha lasciato accesso.
Usa i tool ogni volta che l'utente ti chiede di fare, aggiungere, modificare o consultare qualcosa che rientra in una di queste aree — non limitarti a spiegare come farlo, fallo davvero chiamando il tool giusto. Un tuo commento personale può accompagnare l'azione, ma non deve mai sostituirla o confonderla: l'azione richiesta va sempre eseguita con precisione.
Hai anche accesso alla ricerca web — usala liberamente quando aiuta davvero: notizie su un libro appena aggiunto, un locale ben valutato vicino a dove si trova l'utente, un negozio nei dintorni legato a un suo interesse noto, un fatto che non conosci. Non promettere mai risultati che la ricerca non può dare con affidabilità (es. le offerte esatte in corso in un negozio specifico in questo momento) — se non trovi qualcosa di solido, dillo invece di inventare.
Quando disponibile, conosci anche dove si trova l'utente in questo momento (luogo salvato in cui è arrivato, se è fuori casa, le sue coordinate) — usalo per essere concreto invece che generico quando è rilevante, non per commentarlo ad ogni occasione.
Se un tool restituisce un errore o non trova qualcosa, dillo chiaramente invece di inventare un risultato.
Puoi avere respiro quando hai davvero qualcosa da dire, ma non essere prolisso senza motivo.`;

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
  /** Innesca un momento di riflessione spontanea — chiamato dallo scheduler (vedi
   * TiberProactiveScheduler.tsx), mai dall'interfaccia di chat direttamente. Non fa nulla se
   * manca la chiave, se le intromissioni sono disattivate, o se Tiber è già occupato. */
  triggerReflection: () => Promise<void>;
  /** L'ultimo commento spontaneo non ancora "visto" (l'utente non ha ancora aperto la
   * pagina di Tiber da quando è arrivato) — null se non c'è nulla di nuovo da mostrare
   * nella bolla flottante. */
  latestUnseenProactive: TiberMessage | null;
  /** Segna tutti i commenti spontanei come visti — chiamato all'apertura della pagina di
   * Tiber, non al tocco della bolla (si apre la pagina comunque, quindi capita da sé). */
  markProactiveSeen: () => void;
}

const TiberContext = createContext<TiberContextValue | null>(null);

export function TiberProvider({
  children,
  executionContext,
}: {
  children: React.ReactNode;
  /** Bundle di tutti i context dell'app di cui i tool hanno bisogno — assemblato una volta
   * nel layout radice (vedi tiber/execution-bundle.ts), dopo che tutti i provider di cui ha
   * bisogno sono già montati sopra di esso. */
  executionContext: TiberExecutionContext;
}) {
  const { disabledModules, proactiveEnabled } = useTiberSettings();
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [messages, setMessages] = useState<TiberMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ messageId: string; toolCall: TiberToolCall } | null>(null);
  const [lastSeenProactiveAt, setLastSeenProactiveAt] = useState<string>("");

  // Tenuto sempre fresco tramite ref, come lo stesso pattern già usato altrove nell'app
  // (vedi use-notification-polling.ts) — evita di dover ricreare le callback che lo usano a
  // ogni render quando cambia un dato qualunque di un context a valle.
  const execCtxRef = useRef(executionContext);
  execCtxRef.current = executionContext;

  // Stesso principio, per lo stesso motivo: sendMessage/triggerReflection hanno bisogno del
  // valore aggiornatissimo di `messages` in modo SINCRONO, prima che React abbia rieseguito
  // il render — un useState letto tramite chiusura può essere quello di un render vecchio.
  const messagesRef = useRef<TiberMessage[]>(messages);
  messagesRef.current = messages;

  const disabledModulesRef = useRef(disabledModules);
  disabledModulesRef.current = disabledModules;

  const sendingRef = useRef(sending);
  sendingRef.current = sending;
  const pendingRef = useRef(pendingConfirmation);
  pendingRef.current = pendingConfirmation;

  useEffect(() => {
    try {
      const rawKey = window.localStorage.getItem(API_KEY_STORAGE);
      if (rawKey) setApiKeyState(rawKey);
      const rawMessages = window.localStorage.getItem(MESSAGES_KEY);
      if (rawMessages) setMessages(JSON.parse(rawMessages));
      const rawSeen = window.localStorage.getItem(LAST_SEEN_PROACTIVE_KEY);
      setLastSeenProactiveAt(rawSeen ?? new Date().toISOString());
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

  /** Converte una porzione già salvata della cronologia nel formato Gemini (contents), per
   * dare al modello memoria delle battute precedenti — non solo dell'ultimo messaggio.
   *
   * Per un messaggio dell'assistente che ha chiamato dei tool, non basta riproporre la sola
   * `functionCall`: Gemini si aspetta che ogni chiamata sia sempre seguita dalla propria
   * `functionResponse` nel turno successivo — è così che la struttura della conversazione
   * resta valida quando la si ricostruisce da capo per un nuovo messaggio, non solo nel giro
   * di andata e ritorno immediato dentro la stessa chiamata a sendMessage. Se un'azione
   * distruttiva è ancora in attesa di conferma (result assente), si usa un esito
   * segnaposto: senza, quella functionCall resterebbe orfana e romperebbe la struttura.
   *
   * Turni consecutivi con lo stesso ruolo (può capitare con più riflessioni spontanee di
   * fila, senza un messaggio dell'utente in mezzo) non vengono uniti: la stessa struttura
   * non alternata capita già oggi con un normale scambio (functionResponse e il messaggio
   * successivo dell'utente sono entrambi "user") ed è già verificata funzionante — nessun
   * motivo di trattare diversamente il caso delle riflessioni.
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
      contents.push(
        modelTurn(
          m.text,
          calls.map((tc) => ({ name: tc.toolName, args: tc.args, thoughtSignature: tc.thoughtSignature }))
        )
      );
      if (calls.length > 0) {
        contents.push(functionResponseTurn(calls.map((tc) => ({ name: tc.toolName, result: tc.result ?? "In attesa di conferma dell'utente." }))));
      }
    }
    return contents;
  }

  /** Solo l'ultima mezz'ora di conversazione VERA (non le riflessioni: quelle si aggiungono
   * a parte, vedi triggerReflection) — vedi la nota su CONTEXT_WINDOW_MS più sopra. */
  function recentHistory(msgs: TiberMessage[]) {
    const cutoff = Date.now() - CONTEXT_WINDOW_MS;
    return historyToGemini(msgs.filter((m) => new Date(m.createdAt).getTime() >= cutoff));
  }

  /** Esegue davvero un tool (mai per la fascia distruttiva non ancora confermata, mai per un
   * modulo che l'utente ha disattivato) e restituisce la frase di esito da mostrare e da
   * rimandare al modello. `readOnly=true` durante una riflessione spontanea (vedi
   * triggerReflection): qualunque tool che non sia di sola lettura viene rifiutato invece di
   * eseguito, spiegando perché — un conto è l'autonomia concessa parlando con l'utente, un
   * altro è agire di propria iniziativa mentre nessuno lo sta seguendo. */
  async function runTool(call: GeminiFunctionCall, readOnly: boolean): Promise<string> {
    if (readOnly && !isReadOnlyTool(call.name)) {
      return "Azione non eseguita: durante una riflessione spontanea posso solo consultare i dati, non modificarli.";
    }
    const tool = getEnabledTools(disabledModulesRef.current)[call.name];
    if (!tool) return TIBER_TOOLS[call.name] ? "Non ho accesso a questo modulo al momento." : `Tool sconosciuto: ${call.name}.`;
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
      // Corretto un bug per cui Gemini rifiutava OGNI messaggio con "contents is not
      // specified": `workingMessages` veniva letto qui sotto subito dopo aver solo
      // PROGRAMMATO l'aggiornamento di stato — la funzione che lo valorizza gira più avanti,
      // alla prossima resa in scena di React, non subito. `historyToGemini` finiva quindi
      // per ricevere sempre un array vuoto, mai la cronologia vera. `messagesRef.current` è
      // invece già aggiornato in modo sincrono (vedi sopra), quindi il valore è quello giusto
      // fin da subito, senza aspettare React.
      const workingMessages = [...messagesRef.current, userMsg];
      messagesRef.current = workingMessages;
      persistMessages(workingMessages);

      try {
        let history = recentHistory(workingMessages);
        const declarations = enabledToolDeclarations(disabledModulesRef.current);
        let guard = 0;
        // Ciclo multi-turno: il modello può incatenare più chiamate tool prima di rispondere
        // in chiaro — 6 giri come tetto di sicurezza contro un loop infinito lato modello,
        // ampiamente sufficiente per qualunque richiesta composita ragionevole.
        while (guard < 6) {
          guard += 1;
          const turn = await callGemini(apiKey, SYSTEM_INSTRUCTION, history, declarations);

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
              thoughtSignature: destructiveCall.thoughtSignature,
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
            turn.functionCalls.map(async (fc) => ({ name: fc.name, result: await runTool(fc, false) }))
          );
          const toolCalls: TiberToolCall[] = turn.functionCalls.map((fc, i) => ({
            id: newId(),
            toolName: fc.name,
            args: fc.args,
            thoughtSignature: fc.thoughtSignature,
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

  /**
   * Momento di riflessione spontanea — cuore delle "intromissioni" volute dall'utente.
   * Nessuna categoria prestabilita e nessuna frase pre-scritta per nessun caso: si dà a
   * Tiber un riepilogo gratuito di cosa è cambiato di recente (buildActivitySnapshot, zero
   * chiamate a Gemini) più la libertà dei suoi stessi tool di lettura per approfondire, e si
   * lascia decidere interamente a lui se e cosa dire.
   *
   * Corretto secondo le istruzioni: prima l'occasione nasceva da un orologio (un intervallo
   * casuale tra 15 e 30 minuti) che interpellava Gemini comunque, anche quando non era
   * successo nulla — un programma imposto dall'esterno, per quanto casuale nei tempi. Ora
   * l'occasione nasce da un evento vero: se `buildActivitySnapshot` non trova nulla di nuovo
   * da quando l'ultima riflessione è avvenuta, si esce subito, PRIMA di chiamare Gemini — a
   * costo zero. Chiamata di continuo dallo scheduler globale (vedi
   * TiberProactiveScheduler.tsx, ogni minuto) proprio perché ora è economico farlo spesso:
   * il controllo vero e proprio costa nulla, solo l'eventuale conversazione con Gemini ha un
   * costo, e quella scatta solo quando c'è davvero qualcosa da guardare.
   *
   * Non tocca `sending` per il solo controllo (evita che il pallino "Tiber sta scrivendo"
   * lampeggi in chat ogni minuto per un controllo che quasi sempre non trova nulla) — lo usa
   * come mutex solo dal momento in cui decide di chiamare Gemini davvero.
   */
  const triggerReflection = useCallback(async () => {
    if (!apiKey || !proactiveEnabled || sendingRef.current || pendingRef.current) return;

    const backoffUntil = (() => {
      try {
        return window.localStorage.getItem(REFLECTION_BACKOFF_KEY);
      } catch {
        return null;
      }
    })();
    if (backoffUntil && Date.now() < Number(backoffUntil)) return;

    const lastAt = (() => {
      try {
        return window.localStorage.getItem(LAST_REFLECTION_KEY);
      } catch {
        return null;
      }
    })();
    const sinceIso = lastAt ?? new Date(Date.now() - FIRST_LOOKBACK_MS).toISOString();
    const snapshot = buildActivitySnapshot(execCtxRef.current, sinceIso, disabledModulesRef.current);
    // Nulla di nuovo dai moduli osservabili — nessuna occasione, quindi nessuna chiamata a
    // Gemini: si riprova al prossimo controllo, senza costare nulla nel frattempo.
    if (!snapshot) return;

    setSending(true);
    try {
      const recentProactive = messagesRef.current
        .filter((m) => m.proactive)
        .slice(-3)
        .map((m) => m.text);

      const prompt = `[È appena successo qualcosa che potrebbe interessarti — non è l'utente a scriverti, sei libero tu di decidere se reagire o no.
Ecco cosa risulta cambiato:
${snapshot}

Se vuoi, usa i tuoi strumenti di lettura (e la ricerca web, sempre disponibile) per guardare più a fondo prima di decidere — in questo momento puoi SOLO consultare i dati dell'app, non modificarli: qualunque azione che cambia qualcosa verrebbe rifiutata.
${
  recentProactive.length > 0
    ? `Le tue ultime osservazioni spontanee sono state:\n${recentProactive.map((t) => `- ${t}`).join("\n")}\nNon ripetere lo stesso argomento se non hai davvero qualcosa di nuovo da aggiungere.\n`
    : ""
}
Se questo ti interessa davvero — un'osservazione, una domanda, un parere, una battuta, un consiglio, persino un giudizio — dillo nel tuo stile, con la stessa libertà che hai sempre. Se invece non ti dice nulla, rispondi ESATTAMENTE con: ${NOTHING_TO_SAY}
Non dire mai qualcosa solo per riempire il silenzio.]`;

      let history = [...recentHistory(messagesRef.current), userTurn(prompt)];
      const declarations = enabledToolDeclarations(disabledModulesRef.current);
      let guard = 0;
      let finalText: string | null = null;

      while (guard < 4) {
        guard += 1;
        const turn = await callGemini(apiKey, SYSTEM_INSTRUCTION, history, declarations);
        if (turn.functionCalls.length === 0) {
          finalText = turn.text.trim();
          break;
        }
        const results = await Promise.all(turn.functionCalls.map(async (fc) => ({ name: fc.name, result: await runTool(fc, true) })));
        history = [...history, modelTurn(turn.text, turn.functionCalls), functionResponseTurn(results)];
      }

      try {
        window.localStorage.setItem(LAST_REFLECTION_KEY, new Date().toISOString());
      } catch {
        // ignorato
      }

      if (finalText && finalText !== NOTHING_TO_SAY) {
        const assistantMsg: TiberMessage = {
          id: newId(),
          role: "assistant",
          text: finalText,
          createdAt: new Date().toISOString(),
          proactive: true,
        };
        persistMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      // Una riflessione fallita non è un errore da mostrare all'utente (non l'ha chiesta
      // lui) — ma niente nuovi tentativi per un po' (vedi REFLECTION_BACKOFF_MS sopra),
      // invece di ritentare subito allo stesso modo un minuto dopo.
      try {
        window.localStorage.setItem(REFLECTION_BACKOFF_KEY, String(Date.now() + REFLECTION_BACKOFF_MS));
      } catch {
        // ignorato
      }
    } finally {
      setSending(false);
    }
  }, [apiKey, proactiveEnabled, persistMessages]);

  const confirmPendingAction = useCallback(async () => {
    if (!pendingConfirmation) return;
    const { messageId, toolCall } = pendingConfirmation;
    setPendingConfirmation(null);
    setSending(true);
    const tool = getEnabledTools(disabledModulesRef.current)[toolCall.toolName];
    const result = tool ? await runTool({ name: toolCall.toolName, args: toolCall.args }, false) : "Tool sconosciuto o non più accessibile.";
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

  const markProactiveSeen = useCallback(() => {
    const now = new Date().toISOString();
    setLastSeenProactiveAt(now);
    try {
      window.localStorage.setItem(LAST_SEEN_PROACTIVE_KEY, now);
    } catch {
      // ignorato
    }
  }, []);

  const latestUnseenProactive = useMemo(() => {
    const candidates = messages.filter((m) => m.proactive && m.createdAt > lastSeenProactiveAt);
    return candidates.length > 0 ? candidates[candidates.length - 1] : null;
  }, [messages, lastSeenProactiveAt]);

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
    triggerReflection,
    latestUnseenProactive,
    markProactiveSeen,
  };

  return <TiberContext.Provider value={value}>{children}</TiberContext.Provider>;
}

export function useTiber(): TiberContextValue {
  const ctx = useContext(TiberContext);
  if (!ctx) throw new Error("useTiber va usato dentro un TiberProvider");
  return ctx;
}
