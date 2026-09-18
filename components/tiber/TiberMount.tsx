"use client";
import { TiberSettingsProvider } from "@/lib/tiber/settings-context";
import { TiberProvider } from "@/lib/tiber/context";
import { useTiberExecutionContext } from "@/lib/tiber/execution-bundle";
import { TiberFloatingBubble } from "./TiberFloatingBubble";
import { TiberProactiveScheduler } from "./TiberProactiveScheduler";

/**
 * Monta Tiber una sola volta per tutta l'app, qui e non più dentro le sue due pagine (vedi
 * app/tiber/page.tsx e app/tiber/impostazioni/page.tsx, ora semplici consumatori di
 * useTiber()) — necessario perché la bolla flottante globale e lo scheduler delle
 * riflessioni spontanee devono restare vivi anche quando l'utente è su una scheda diversa da
 * quella di Tiber, non solo mentre la chat è aperta. Va dentro tutti i provider di cui i tool
 * di Tiber hanno bisogno (vedi execution-bundle.ts) — per questo vive innestato in fondo
 * all'albero del layout radice, non più in alto.
 */
export function TiberMount({ children }: { children: React.ReactNode }) {
  const executionContext = useTiberExecutionContext();
  return (
    <TiberSettingsProvider>
      <TiberProvider executionContext={executionContext}>
        {children}
        <TiberFloatingBubble />
        <TiberProactiveScheduler />
      </TiberProvider>
    </TiberSettingsProvider>
  );
}
