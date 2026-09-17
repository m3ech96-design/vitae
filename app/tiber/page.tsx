"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Trash2, Loader2 } from "lucide-react";
import { TiberProvider, useTiber } from "@/lib/tiber/context";
import { useTiberExecutionContext } from "@/lib/tiber/execution-bundle";
import { TiberMessageBubble } from "@/components/tiber/TiberMessageBubble";
import { TiberApiKeySetup } from "@/components/tiber/TiberApiKeySetup";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";

function TiberChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, apiKey, messages, sending, error, sendMessage, clearConversation } = useTiber();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardInset = useKeyboardInset();
  const autoSentRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Il messaggio scritto nella barra rapida di Home arriva qui come ?q=... — inviato una
  // sola volta all'apertura (mai a ogni render, mai di nuovo se l'utente torna indietro e
  // riapre la stessa URL con lo storico già presente), e solo quando c'è già una chiave
  // impostata: senza chiave il messaggio resterebbe silenziosamente perso nel limbo.
  useEffect(() => {
    if (!hydrated || !apiKey || autoSentRef.current) return;
    const q = searchParams.get("q");
    if (q) {
      autoSentRef.current = true;
      sendMessage(q);
      router.replace("/tiber");
    }
  }, [hydrated, apiKey, searchParams, sendMessage, router]);

  if (!hydrated) return null;

  const send = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200">
          <ArrowLeft size={14} /> Indietro
        </button>
        {messages.length > 0 && (
          <button onClick={clearConversation} className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-aura-pink">
            <Trash2 size={12} /> Azzera
          </button>
        )}
      </div>

      <div className="mt-4">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Vitae</p>
        <h1 className="mt-1 font-display text-2xl text-ink-100">Tiber</h1>
        <p className="mt-1 text-sm text-ink-600">Il tuo maggiordomo — chiedigli qualunque cosa sui tuoi dati.</p>
      </div>

      {!apiKey ? (
        <div className="mt-6">
          <TiberApiKeySetup />
        </div>
      ) : (
        <>
          <div className="mt-6 flex-1 space-y-3 pb-32">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-sm text-ink-800">
                Scrivi a Tiber per iniziare — può creare task, registrare spese, aggiornare la dispensa e molto altro.
              </p>
            )}
            {messages.map((m) => (
              <TiberMessageBubble key={m.id} message={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-ink-600">
                <Loader2 size={12} className="animate-spin" /> Tiber sta pensando...
              </div>
            )}
            {error && <p className="text-xs text-aura-pink">{error}</p>}
            <div ref={scrollRef} />
          </div>

          <div
            className="fixed inset-x-0 z-20 mx-auto w-full max-w-xl px-5 pb-[max(env(safe-area-inset-bottom),1rem)] sm:px-6"
            style={{ bottom: keyboardInset }}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-void-950/90 p-2 backdrop-blur-xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Scrivi a Tiber..."
                disabled={sending}
                className="focus-ring min-w-0 flex-1 bg-transparent px-3 text-sm text-ink-100 placeholder:text-ink-800"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950 disabled:opacity-30"
                aria-label="Invia"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TiberPageInner() {
  const executionContext = useTiberExecutionContext();
  return (
    <TiberProvider executionContext={executionContext}>
      <TiberChat />
    </TiberProvider>
  );
}

export default function TiberPage() {
  // Suspense richiesto da Next.js per useSearchParams (legge ?q=... dalla barra rapida di
  // Home) — nessun fallback visibile: la pagina è già interamente client-side e hydrated
  // gestisce già il primo istante prima che i context si popolino.
  return (
    <Suspense fallback={null}>
      <TiberPageInner />
    </Suspense>
  );
}
