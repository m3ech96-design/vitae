import { NextResponse } from "next/server";

/**
 * "Possibilità di lasciare che sia l'AI a descrivere il momento in modo sobrio ma ricco,
 * attenendo il tono descrittivo al tipo di stato d'animo del post" — l'unico punto in cui
 * Vitaegram usa un'intelligenza artificiale, e solo per scrivere, mai per immagini. Gira sul
 * server apposta: la chiave API non deve mai arrivare al browser (vedi ANTHROPIC_API_KEY
 * nelle variabili d'ambiente del progetto — su Vercel: Impostazioni Progetto → Environment
 * Variables). Riceve solo i segnali veri scelti dall'utente in "Imprimi Momento", non
 * inventa eventi che non ci sono. Resta sempre una proposta: torna al client e basta, la
 * pubblicazione è sempre un gesto separato e consapevole.
 */
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Manca ANTHROPIC_API_KEY nelle variabili d'ambiente del progetto." },
      { status: 501 }
    );
  }

  const { context, moodLabel } = (await req.json()) as { context?: string; moodLabel?: string };
  if (!context || !context.trim()) {
    return NextResponse.json({ error: "Nessun segnale del momento da cui partire." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system: `Scrivi una singola didascalia breve (massimo 30 parole), in italiano, in prima persona, per un post di un social network personale. Tono sobrio ma ricco: concreto, mai plateale. ${
          moodLabel ? `Intona il tono allo stato d'animo "${moodLabel}" senza nominarlo esplicitamente nel testo.` : ""
        } Usa SOLO i fatti forniti, non inventare nulla che non sia elencato. Restituisci solo la didascalia, senza virgolette e senza premessa.`,
        messages: [{ role: "user", content: context }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Anthropic ha risposto con un errore: ${detail.slice(0, 200)}` }, { status: 502 });
    }

    const data = await response.json();
    const caption = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join(" ")
      .trim();

    if (!caption) return NextResponse.json({ error: "Nessuna bozza generata." }, { status: 502 });
    return NextResponse.json({ caption });
  } catch {
    return NextResponse.json({ error: "Impossibile contattare il servizio in questo momento." }, { status: 502 });
  }
}
