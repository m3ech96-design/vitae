"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, ExternalLink, Trash2, Sparkles, ShieldCheck, Check, MessageCircleDashed, LayoutGrid, Volume2 } from "lucide-react";
import { useTiber } from "@/lib/tiber/context";
import { useTiberSettings } from "@/lib/tiber/settings-context";
import { TIBER_MODULES } from "@/lib/tiber/registry";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function TiberSettingsPage() {
  const router = useRouter();
  const { hydrated, apiKey, setApiKey, messages, clearConversation } = useTiber();
  const {
    hydrated: settingsHydrated,
    disabledModules,
    toggleModule,
    proactiveEnabled,
    setProactiveEnabled,
    voiceEnabled,
    setVoiceEnabled,
  } = useTiberSettings();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!hydrated || !settingsHydrated) return null;

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
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageCircleDashed size={16} className="text-aura-violet" />
              <p className="font-display text-sm text-ink-100">Intromissioni spontanee</p>
            </div>
            <button
              onClick={() => setProactiveEnabled(!proactiveEnabled)}
              className={`focus-ring relative h-6 w-11 shrink-0 rounded-full transition ${proactiveEnabled ? "bg-aura-gradient" : "bg-white/10"}`}
              aria-label={proactiveEnabled ? "Disattiva" : "Attiva"}
              role="switch"
              aria-checked={proactiveEnabled}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-void-950 transition-transform ${proactiveEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          <p className="text-xs text-ink-600">
            Quando attive, Tiber si accorge da solo quando succede qualcosa di notabile nei tuoi dati (uno stato d'animo, una
            voce d'Hobby, del Diario o della Wishlist) e, solo allora — mai a orario fisso — decide se dire qualcosa: un'osservazione,
            una domanda, un parere. Una bolla flottante te lo fa sapere ovunque tu sia nell'app. Nessuna categoria fissa: decide
            lui, ogni volta, se e cosa dire — spesso, anche, di non dire nulla.
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-aura-violet" />
              <p className="font-display text-sm text-ink-100">Tiber ti parla</p>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`focus-ring relative h-6 w-11 shrink-0 rounded-full transition ${voiceEnabled ? "bg-aura-gradient" : "bg-white/10"}`}
              aria-label={voiceEnabled ? "Disattiva" : "Attiva"}
              role="switch"
              aria-checked={voiceEnabled}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-void-950 transition-transform ${voiceEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          <p className="text-xs text-ink-600">
            Spento di default. Acceso: le risposte di Tiber (sia in chat sia dopo un'intromissione spontanea che hai
            accettato) vengono lette ad alta voce dal telefono, un'icona di microfono compare accanto al campo di
            testo per rispondergli a voce (tieni premuto, parla, rilascia), e un'intromissione spontanea passa prima
            da un piccolo popup con un suono — "Tiber vorrebbe parlarti", spunta per sentirla, X per ignorarla come
            sempre — invece di leggerti subito il messaggio ad alta voce senza chiedere. Spento, nessuna di queste tre
            cose esiste nell'interfaccia: niente permesso del microfono richiesto, niente lettura vocale avviata.
          </p>
          <p className="mt-2 text-xs text-ink-600">
            Il tuo audio va così com'è a Gemini (mai trascritto dal telefono) — in chat compare come "🎤 Messaggio
            vocale" invece del testo esatto detto. Su iPhone, dopo il primo scambio vocale la lettura automatica
            della risposta successiva potrebbe talvolta uscire muta — un limite noto di Safari, non un errore
            dell'app: si corregge da solo riprovando lo scambio.
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <LayoutGrid size={16} className="text-aura-cyan" />
            <p className="font-display text-sm text-ink-100">Accesso ai tuoi dati</p>
          </div>
          <p className="mb-3 text-xs text-ink-600">
            Togli la spunta a una scheda per negare a Tiber ogni accesso a quei dati — non li vedrà nelle riflessioni spontanee, non
            potrà consultarli né modificarli nemmeno se glielo chiedi esplicitamente in chat.
          </p>
          <div className="space-y-1">
            {TIBER_MODULES.map((m) => {
              const checked = !disabledModules.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5"
                >
                  <span className="text-sm text-ink-100">{m.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleModule(m.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-aura-violet"
                  />
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-600">
            Con "Mappa" spuntato, Tiber sa anche dove ti trovi quando arrivi in un luogo salvato diverso da casa, se sei fuori
            all'ora dei pasti, e può cercare sul web posti ben valutati o negozi nei dintorni — ma solo se il "Rilevamento
            posizione" è acceso (l'icona in Home). Spento lì, questa parte resta silenziosa a prescindere dalla spunta qui.
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-aura-cyan" />
            <p className="font-display text-sm text-ink-100">Autonomia</p>
          </div>
          <p className="text-xs text-ink-600">
            Tiber esegue da solo qualunque azione i suoi strumenti permettono. Per le azioni distruttive — cancellazioni,
            prelievi di denaro, eliminazione di persone o animali — chiede sempre conferma prima di procedere. Durante una
            riflessione spontanea, invece, può solo consultare i dati: non esegue mai un'azione che li modifica senza che tu
            gliel'abbia chiesto in chat.
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-aura-violet" />
            <p className="font-display text-sm text-ink-100">Modello</p>
          </div>
          <p className="text-xs text-ink-600">Google Gemini 3.5 Flash-Lite, piano gratuito.</p>
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
