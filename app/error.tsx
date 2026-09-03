"use client";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

/**
 * Error boundary di root — Next.js lo monta automaticamente attorno a ogni route quando un
 * componente client sotto di essa lancia un'eccezione non gestita durante il render.
 *
 * Prima non esisteva nessun boundary in tutta l'app: un errore runtime in un componente
 * qualsiasi (es. un bug nei React Hooks, un accesso a un campo mancante su dati vecchi) non
 * veniva contenuto da nulla e faceva collassare l'intera interfaccia su uno schermo bianco,
 * senza modo di recuperare se non ricaricando manualmente la pagina — cosa che, dato che
 * l'app vive solo su questo dispositivo, l'utente medio non avrebbe saputo fare al volo.
 *
 * `reset()` (fornito da Next) riprova a renderizzare lo stesso albero senza un reload
 * completo: risolve gli errori transitori (es. un accesso a un dato non ancora idratato in
 * un componente che non lo controllava). "Torna alla Home" resta come via di fuga sicura se
 * l'errore dipende dalla route specifica su cui ci si trovava.
 */
export default function GlobalErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center px-6 text-center">
      <GlassCard className="w-full p-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-aura-pink/15">
          <AlertTriangle size={22} className="text-aura-pink" />
        </div>
        <p className="mt-4 font-display text-base text-ink-100">Qualcosa è andato storto</p>
        <p className="mt-1.5 text-sm text-ink-600">
          I tuoi dati restano salvati su questo dispositivo. Prova a riprovare, o torna alla Home.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button size="sm" onClick={reset}>
            <RotateCcw size={16} /> Riprova
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
            <Home size={16} /> Torna alla Home
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
