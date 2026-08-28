"use client";
import { useIllness } from "@/lib/illness-context";

/**
 * Non tocca la barra di navigazione — è infrastruttura, non "te". Il segnale vive un
 * livello sopra ai singoli componenti: una vignettatura appena percettibile ai margini di
 * tutta la vista, che richiama come si restringe il campo percettivo quando si sta poco
 * bene. Fissa (non un'animazione a ciclo): è una condizione, non un evento.
 */
export function IllnessVignette() {
  const { illness } = useIllness();
  if (!illness) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-1000"
      style={{
        background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(7,8,13,0.55) 100%)",
      }}
      aria-hidden
    />
  );
}
