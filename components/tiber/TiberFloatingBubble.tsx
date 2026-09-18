"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Check, Mic, PhoneOff } from "lucide-react";
import { useTiber } from "@/lib/tiber/context";
import { useTiberSettings } from "@/lib/tiber/settings-context";
import { useVoiceRecorder } from "@/lib/tiber/use-voice-recorder";
import { playProactiveChime, speakTiberMessage, stopSpeaking, primeSpeechEngine } from "@/lib/tiber/speech";

/**
 * Rende visibile ovunque nell'app l'ultimo commento spontaneo di Tiber non ancora letto —
 * "presente in modo globale, non solo nella Home" come richiesto esplicitamente. Il testo
 * vero vive nel context (TiberProvider, montato una volta nel layout radice, vedi
 * lib/tiber/context.tsx e triggerReflection lì dentro): questa bolla ne è solo una vetrina,
 * sparisce da sola non appena l'utente apre la pagina di Tiber (che segna tutto come "visto"
 * al montaggio) o quando la si tocca per aprirla direttamente da qui.
 *
 * Sul lato sinistro apposta, non destro: la pillola del cronometro Hobby (vedi
 * FloatingHobbyTimerPill.tsx) occupa già quel lato quando un cronometro è attivo — le due
 * non devono mai sovrapporsi, e possono benissimo essere visibili entrambe insieme.
 *
 * Con l'interruttore "Tiber ti parla" (voiceEnabled) SPENTO, questo componente si comporta
 * esattamente come prima che il flusso vocale esistesse — stesso JSX, stesso comportamento,
 * nessuna diramazione nuova nemmeno silenziosa (vedi il ramo `if (!voiceEnabled)` qui sotto,
 * che è un ramo a parte, non un flag che disabilita pezzi del ramo vocale). Acceso, invece,
 * un'intromissione spontanea passa da un gate esplicito prima di far sentire l'audio: arriva
 * un suono + il generico "Tiber vorrebbe parlarti" (mai il testo vero, non ancora), poi una
 * spunta per accettare (rivela il testo, lo legge ad alta voce, attacca microfono e pulsante
 * "termina" alla bolla) o una X per rifiutare (identico a ignorare la bolla di sempre).
 */
export function TiberFloatingBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, apiKey, latestUnseenProactive, markProactiveSeen, messages, sendVoiceMessage, sending } = useTiber();
  const { voiceEnabled } = useTiberSettings();

  // Quale intromissione è "in sospeso" (suono già suonato, in attesa di spunta/X) o
  // "accettata" (audio ascoltato, microfono+termina ora attaccati alla bolla) — vive qui, non
  // nel context, perché riguarda solo questa vetrina, mai lo stato vero della conversazione.
  const [gate, setGate] = useState<{ id: string; status: "pending" | "accepted" } | null>(null);
  // Garantisce che il suono suoni una volta sola per ogni singola intromissione, anche se
  // questo componente si ri-rende più volte prima che l'utente decida — un id già suonato non
  // fa ripartire il gate da capo solo perché `messages` è cambiato per un altro motivo.
  const chimedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!voiceEnabled || !latestUnseenProactive) return;
    if (chimedIdRef.current === latestUnseenProactive.id) return;
    chimedIdRef.current = latestUnseenProactive.id;
    setGate({ id: latestUnseenProactive.id, status: "pending" });
    playProactiveChime();
  }, [voiceEnabled, latestUnseenProactive]);

  // L'hook va chiamato sempre, anche quando il ramo vocale non è quello attivo in questo
  // render (regola dei hook React: nessuna chiamata condizionale) — non registra comunque
  // alcun microfono finché `recorder.start()` non viene davvero invocato da un tocco.
  const recorder = useVoiceRecorder(async (blob, mimeType) => {
    await sendVoiceMessage(blob, mimeType);
  });

  if (!hydrated || !apiKey || !latestUnseenProactive || pathname === "/tiber") return null;

  // --- Interruttore spento: invariato rispetto a prima che il flusso vocale esistesse. ---
  if (!voiceEnabled) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          className="fixed left-4 z-[45] bottom-[calc(env(safe-area-inset-bottom)+84px)]"
        >
          <button
            onClick={() => router.push("/tiber")}
            className="focus-ring glass-nav flex max-w-[75vw] items-start gap-2 rounded-2xl py-2.5 pl-3 pr-2 text-left shadow-glass sm:max-w-sm"
          >
            <Sparkles size={14} className="mt-0.5 shrink-0 text-aura-violet" />
            <p className="line-clamp-2 min-w-0 text-xs text-ink-100">{latestUnseenProactive.text}</p>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                markProactiveSeen();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  markProactiveSeen();
                }
              }}
              className="focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-700 hover:text-ink-200"
              aria-label="Ignora"
            >
              <X size={12} />
            </span>
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Interruttore acceso, ma il gate non ha ancora recepito questa intromissione: l'effect
  // qui sopra lo popolerà al giro di render successivo, un istante impercettibile. ---
  if (!gate || gate.id !== latestUnseenProactive.id) return null;

  // --- In sospeso: suono già suonato, testo vero ancora nascosto dietro spunta/X. ---
  if (gate.status === "pending") {
    const reject = () => {
      markProactiveSeen();
      setGate(null);
    };
    const accept = () => {
      setGate({ id: latestUnseenProactive.id, status: "accepted" });
      speakTiberMessage(latestUnseenProactive.text);
      markProactiveSeen();
    };
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          className="fixed left-4 z-[45] bottom-[calc(env(safe-area-inset-bottom)+84px)]"
        >
          <div className="glass-nav flex max-w-[75vw] items-center gap-2 rounded-2xl py-2 pl-3 pr-2 shadow-glass sm:max-w-sm">
            <Sparkles size={14} className="shrink-0 text-aura-violet" />
            <p className="min-w-0 flex-1 text-xs text-ink-100">Tiber vorrebbe parlarti</p>
            <button
              onClick={reject}
              className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-700 hover:text-aura-pink"
              aria-label="Rifiuta"
            >
              <X size={13} />
            </button>
            <button
              onClick={accept}
              className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950"
              aria-label="Accetta"
            >
              <Check size={13} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Accettata: conversazione vocale attiva. Il testo mostrato segue l'ultima risposta
  // vera di Tiber (non resta fermo al primo commento spontaneo) — ogni nuova risposta viene
  // già letta ad alta voce da sola tramite runTurnLoop in context.tsx, questa bolla si limita
  // a mostrarla, non deve richiamare speakTiberMessage una seconda volta per essa. ---
  const lastAssistantText = [...messages].reverse().find((m) => m.role === "assistant")?.text || latestUnseenProactive.text;

  const endConversation = () => {
    stopSpeaking();
    recorder.cancel();
    setGate(null);
  };

  const releaseMic = () => {
    // Nello stesso gesto di rilascio, PRIMA di aspettare la risposta di Gemini in modo
    // asincrono — vedi la nota su primeSpeechEngine in lib/tiber/speech.ts.
    primeSpeechEngine();
    recorder.stop();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        className="fixed left-4 z-[45] flex flex-col gap-1.5 bottom-[calc(env(safe-area-inset-bottom)+84px)]"
      >
        <button
          onClick={() => router.push("/tiber")}
          className="focus-ring glass-nav flex max-w-[75vw] items-start gap-2 rounded-2xl py-2.5 pl-3 pr-2 text-left shadow-glass sm:max-w-sm"
        >
          <Sparkles size={14} className="mt-0.5 shrink-0 text-aura-violet" />
          <p className="line-clamp-3 min-w-0 text-xs text-ink-100">{lastAssistantText}</p>
        </button>

        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={endConversation}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-void-950/90 text-ink-400 backdrop-blur-xl hover:border-aura-pink/50 hover:text-aura-pink"
            aria-label="Termina conversazione"
          >
            <PhoneOff size={14} />
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              if (sending) return;
              recorder.start();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              releaseMic();
            }}
            onPointerLeave={() => {
              if (recorder.phase === "recording") releaseMic();
            }}
            disabled={sending}
            style={{ touchAction: "none" }}
            className={`focus-ring flex h-9 w-9 items-center justify-center rounded-full text-void-950 disabled:opacity-30 ${
              recorder.phase === "recording" ? "animate-pulseSoft bg-aura-pink" : "bg-aura-gradient"
            }`}
            aria-label="Tieni premuto per rispondere a voce"
          >
            <Mic size={15} />
          </button>
        </div>
        {recorder.phase === "denied" && <p className="text-right text-[10px] text-aura-pink">Microfono non disponibile.</p>}
      </motion.div>
    </AnimatePresence>
  );
}
