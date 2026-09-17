"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, ExternalLink, Trash2, Sparkles, ShieldCheck, Check } from "lucide-react";
import { TiberProvider, useTiber } from "@/lib/tiber/context";
import { useTiberExecutionContext } from "@/lib/tiber/execution-bundle";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

function TiberSettingsInner() {
  const router = useRouter();
  const { hydrated, apiKey, setApiKey, messages, clearConversation } = useTiber();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!hydrated) return null;

  const maskedKey = apiKey ? `${apiKey.slice(0, 4)}${"•".repeat(Math.max(apiKey.length - 8, 4))}${apiKey.slice(-4)}` : null;

  const saveKey = () => {
    if (!draft.trim()) return;
    setApiKey(draft.trim());
    setDraft("");
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-16 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200">
        <ArrowLeft size={14} /> Indietro
      </button>

      <p className="mt-4 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-600">
        <Sparkles size={12} /> Tiber
      </p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Impostazioni</h1>

      <div className="mt-6 space-y-4">
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound size={16} className="text-aura-violet" />
            <p className="font-display text-sm text-ink-100">Chiave Gemini</p>
          </div>

          {!editing && apiKey && (
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm text-ink-300">{maskedKey}</p>
              <button
                onClick={() => setEditing(true)}
                className="focus-ring shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-400 hover:border-white/20 hover:text-ink-100"
              >
                Cambia
              </button>
            </div>
          )}

          {(!apiKey || editing) && (
            <div className="space-y-3">
              <p className="text-xs text-ink-600">
                La chiave resta solo su questo dispositivo (localStorage), esclusa dai backup dell'app.
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex items-center gap-1.5 text-xs text-aura-cyan hover:underline"
              >
                Ottieni una chiave gratuita su Google AI Studio <ExternalLink size={11} />
              </a>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Incolla qui la chiave..."
                  className="focus-ring min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
                />
                <Button size="sm" disabled={!draft.trim()} onClick={saveKey}>
                  Salva
                </Button>
              </div>
              {editing && apiKey && (
                <button onClick={() => setEditing(false)} className="focus-ring text-xs text-ink-600 hover:text-ink-200">
                  Annulla
                </button>
              )}
            </div>
          )}

          {saved && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-aura-emerald">
              <Check size={12} /> Chiave salvata.
            </p>
          )}

          {apiKey && !editing && (
            <button
              onClick={() => setApiKey(null)}
              className="focus-ring mt-3 flex items-center gap-1.5 text-xs text-aura-pink hover:underline"
            >
              <Trash2 size={12} /> Rimuovi la chiave
            </button>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-aura-cyan" />
            <p className="font-display text-sm text-ink-100">Autonomia</p>
          </div>
          <p className="text-xs text-ink-600">
            Tiber esegue da solo qualunque azione i suoi strumenti permettono. Per le azioni distruttive — cancellazioni,
            prelievi di denaro, eliminazione di persone o animali — chiede sempre conferma prima di procedere.
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-aura-violet" />
            <p className="font-display text-sm text-ink-100">Modello</p>
          </div>
          <p className="text-xs text-ink-600">Google Gemini 2.5 Flash, piano gratuito.</p>
        </GlassCard>

        <button
          onClick={() => {
            clearConversation();
            router.back();
          }}
          disabled={messages.length === 0}
          className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-white/10 py-3 text-sm text-ink-400 hover:border-aura-pink/40 hover:text-aura-pink disabled:opacity-30"
        >
          <Trash2 size={14} /> Azzera la conversazione
        </button>
      </div>
    </div>
  );
}

export default function TiberSettingsPage() {
  const executionContext = useTiberExecutionContext();
  return (
    <TiberProvider executionContext={executionContext}>
      <TiberSettingsInner />
    </TiberProvider>
  );
}
