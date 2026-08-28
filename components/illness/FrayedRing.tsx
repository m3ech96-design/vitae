"use client";

/**
 * Un anello decorativo puro (nessun contenuto dentro) a cui applicare il filtro sfilacciato
 * — mai il filtro direttamente su un elemento che contiene foto o testo, o li distorcerebbe
 * anche loro. `shape="circle"` per l'avatar, `shape="rect"` per la card.
 */
export function FrayedRing({
  shape,
  inset = -3,
  radius,
}: {
  shape: "circle" | "rect";
  inset?: number;
  radius?: number;
}) {
  return (
    <span
      className="pointer-events-none absolute border-2"
      style={{
        inset,
        borderRadius: shape === "circle" ? "9999px" : (radius ?? 22),
        filter: "url(#fray-edge)",
        // Un caldo ambra spento, non il grigio neutro di prima — si legge come "non stai
        // bene" a colpo d'occhio, coerente con gli altri avvisi caldi dell'app, senza
        // scadere nel rosso "errore".
        borderColor: "rgba(255,180,84,0.65)",
      }}
      aria-hidden
    />
  );
}
