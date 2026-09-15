"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, UserPlus, Loader2 } from "lucide-react";
import { importBackup } from "@/lib/backup";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Primissima schermata prima del wizard di identità — non compare più a ogni avvio, solo
 * finché non esiste ancora un profilo (vedi app/page.tsx: RootPage manda qui solo se
 * `!profile.onboardingComplete`, esattamente la stessa condizione che prima portava dritti
 * al wizard). Due strade, entrambe legittime al primo avvio di un dispositivo nuovo:
 * ricominciare da zero (wizard) o riprendere una vita già raccontata altrove (backup).
 *
 * L'import qui è lo stesso identico meccanismo già usato in BackupSection.tsx (Home →
 * Impostazioni): stessa funzione `importBackup`, stessa conferma esplicita prima di scrivere
 * ovunque, stesso ricaricamento della pagina a importazione riuscita. Non una copia
 * parallela della logica — un secondo punto d'ingresso alla stessa funzione. Dopo il
 * ricaricamento, RootPage rilegge il profilo appena importato: se il backup aveva
 * `onboardingComplete: true` (il caso normale, un backup di un profilo già in uso altrove)
 * l'utente arriva dritto in Home, saltando il wizard da solo — nessuna logica in più da
 * scrivere qui per quel salto.
 */
export default function BenvenutoPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    setError(null);
    try {
      await importBackup(pendingFile);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Importazione non riuscita.");
      setImporting(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center overflow-hidden px-6 pb-10 pt-[max(env(safe-area-inset-top),2rem)] sm:px-6">
      <Reveal>
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-aura-gradient shadow-glow-sm" />
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Vitae</p>
        </div>
        <h1 className="font-display text-2xl text-ink-100">Benvenuto</h1>
        <p className="mt-1.5 text-sm text-ink-600">
          Hai già una vita raccontata su Vitae da un altro dispositivo, o è la prima volta che apri l&apos;app?
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-9 space-y-3">
        <button
          onClick={() => router.push("/wizard")}
          className="focus-ring flex w-full items-center gap-3.5 rounded-xl2 border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition hover:border-aura-violet/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aura-violet/15 text-aura-violet">
            <UserPlus size={18} />
          </span>
          <span>
            <span className="block text-sm text-ink-100">Crea utente</span>
            <span className="mt-0.5 block text-[11px] text-ink-800">Comincia da zero — te lo chiediamo noi passo per passo</span>
          </span>
        </button>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="focus-ring flex w-full items-center gap-3.5 rounded-xl2 border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition hover:border-aura-cyan/50 disabled:opacity-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aura-cyan/15 text-aura-cyan">
            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </span>
          <span>
            <span className="block text-sm text-ink-100">Importa backup</span>
            <span className="mt-0.5 block text-[11px] text-ink-800">Hai già un file di backup esportato da Vitae</span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPendingFile(f);
            e.target.value = "";
          }}
        />
        {error && <p className="text-[11px] text-aura-pink">{error}</p>}
      </Reveal>

      {pendingFile && (
        <ConfirmDialog
          title="Importare questo backup?"
          description="Ripristinerà tutti i dati contenuti nel file su questo dispositivo."
          confirmLabel={importing ? "Importazione..." : "Importa"}
          onCancel={() => setPendingFile(null)}
          onConfirm={confirmImport}
        />
      )}
    </div>
  );
}
