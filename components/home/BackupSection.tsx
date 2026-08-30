"use client";
import { useRef, useState } from "react";
import { Download, Upload, Loader2, Check } from "lucide-react";
import { exportBackup, downloadBackup, importBackup } from "@/lib/backup";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function BackupSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<"export" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const backup = await exportBackup();
      downloadBackup(backup);
      setDone("export");
      setTimeout(() => setDone(null), 3000);
    } catch {
      setError("Non sono riuscito a creare il backup.");
    } finally {
      setExporting(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    setError(null);
    try {
      await importBackup(pendingFile);
      setPendingFile(null);
      setDone("import");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Importazione non riuscita.");
      setImporting(false);
    }
  };

  return (
    <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="mb-1 font-display text-sm text-ink-100">Backup dei tuoi dati</p>
      <p className="mb-4 text-xs text-ink-600">
        Tutto Vive Solo Su Questo Dispositivo. Esporta Ogni Tanto Un Backup, Così Non Perdi Nulla
        Se Cambi Telefono O Cancelli I Dati Del Browser.
      </p>
      <div className="flex gap-2">
        <button
          onClick={doExport}
          disabled={exporting}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-aura-cyan/30 py-2.5 text-xs text-ink-200 transition hover:border-aura-cyan/60 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : done === "export" ? <Check size={13} className="text-aura-cyan" /> : <Download size={13} />}
          {done === "export" ? "Scaricato" : "Esporta"}
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 py-2.5 text-xs text-ink-200 transition hover:border-white/25"
        >
          <Upload size={13} /> Importa
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
      </div>
      {error && <p className="mt-2 text-[11px] text-aura-pink">{error}</p>}

      {pendingFile && (
        <ConfirmDialog
          title="Importare questo backup?"
          description="Sovrascriverà tutti i dati attuali su questo dispositivo. L'app si ricaricherà."
          confirmLabel={importing ? "Importazione..." : "Importa E Sovrascrivi"}
          onCancel={() => setPendingFile(null)}
          onConfirm={confirmImport}
        />
      )}
    </div>
  );
}
