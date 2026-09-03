"use client";

/**
 * Copre il caso che app/error.tsx non può coprire: un errore nel root layout stesso (dove
 * vivono tutti i Provider di contesto) invece che in una singola pagina. Next monta questo
 * al posto dell'intero <html> quando il layout root fallisce, quindi non può assumere che
 * il resto dell'app (CSS globale, componenti condivisi) sia disponibile — volutamente
 * autosufficiente, senza dipendenze da nient'altro nel progetto.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="it">
      <body style={{ background: "#07080D", color: "#E4E6F0", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>Qualcosa è andato storto</p>
          <p style={{ fontSize: "13px", color: "#8B90A8", marginBottom: "20px" }}>
            I tuoi dati restano salvati su questo dispositivo.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#7C5CFF",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "10px 20px",
              fontSize: "14px",
            }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
