/**
 * Sfondo più chiaro di quello "offline" (vedi body::before in globals.css) — solo dentro
 * Vitaecom, un velo aggiuntivo sopra la base scura comune a tutta l'app, non una sostituzione.
 * Stessa tecnica già corretta nel Checkpoint 15 per il gradiente legato allo stato d'animo
 * (livello fisso agganciato al viewport, dietro a tutto il contenuto): così scorrendo non si
 * "rompe" mai, indipendentemente da quanto è alta la pagina. Il colore dominante è l'ambra
 * `#B79A6B`, la stessa identità già usata in ogni angolo di Vitaecom (nav, chat, profilo) —
 * non un chiarore neutro a caso.
 */
export default function VitaecomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-[-1]"
        style={{
          background:
            "radial-gradient(1100px 650px at 15% -8%, rgba(183,154,107,0.16), transparent 60%), " +
            "radial-gradient(900px 550px at 92% 6%, rgba(124,92,255,0.09), transparent 55%), " +
            "radial-gradient(800px 700px at 50% 112%, rgba(0,229,199,0.06), transparent 60%), " +
            "rgba(241,241,250,0.045)",
        }}
      />
      {children}
    </>
  );
}
