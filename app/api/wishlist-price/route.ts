import { NextRequest, NextResponse } from "next/server";

/**
 * Aggiorna il prezzo di un articolo Wishlist leggendolo dalla sua pagina reale (`siteUrl`)
 * — gira lato server per lo stesso motivo di app/api/news/route.ts: un fetch dal browser
 * verso il dominio del negozio incontrerebbe quasi ovunque il suo CORS, che permette la
 * navigazione umana ma non la lettura via JavaScript da un altro sito.
 *
 * Non esiste un formato universale per "il prezzo" nell'HTML di un sito e-commerce
 * qualsiasi — ogni sito lo mostra a modo suo, e provare a interpretare il markup visivo
 * (classi CSS, struttura dei div) si romperebbe al primo redesign del sito, di qualunque
 * sito. La strada affidabile è cercare gli standard che i siti e-commerce seri già
 * pubblicano per i motori di ricerca e la condivisione social, in ordine di affidabilità:
 * 1) dati strutturati schema.org Product/Offer in JSON-LD — il formato pensato apposta per
 *    essere letto da un programma, non da un occhio umano;
 * 2) meta tag Open Graph `product:price:amount` — lo standard più diffuso in assoluto;
 * 3) meta tag `og:price:amount` (variante meno comune ma esistente).
 * Se nessuno dei tre è presente, la risposta è onestamente "non trovato" — nessun tentativo
 * di indovinare un numero dal testo libero della pagina, che darebbe falsi risultati più
 * spesso di quanto aiuterebbe.
 */

function extractJsonLdPrice(html: string): number | null {
  const scriptMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of candidates) {
        const offers = item?.offers;
        const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
        for (const offer of offerList) {
          const price = parseFloat(offer?.price ?? offer?.priceSpecification?.price);
          if (!Number.isNaN(price) && price > 0) return price;
        }
      }
    } catch {
      // JSON-LD malformato o non nella forma attesa: prova il prossimo script, non blocca
      // gli altri metodi di estrazione.
    }
  }
  return null;
}

function extractMetaPrice(html: string, property: string): number | null {
  const regex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(regex) ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"));
  if (!match) return null;
  const price = parseFloat(match[1].replace(",", "."));
  return Number.isNaN(price) || price <= 0 ? null : price;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url mancante" }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "url non valido" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "url non valido" }, { status: 400 });
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        // Molti siti negano la pagina a richieste senza uno User-Agent "da browser" —
        // non è un tentativo di mascherare la natura della richiesta, solo evitare un
        // blocco banale rivolto ai bot senza alcuno User-Agent affatto.
        "User-Agent": "Mozilla/5.0 (compatible; VitaeApp/1.0)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ error: "pagina non raggiungibile" }, { status: 502 });

    const html = await res.text();
    const price = extractJsonLdPrice(html) ?? extractMetaPrice(html, "product:price:amount") ?? extractMetaPrice(html, "og:price:amount");

    if (price === null) return NextResponse.json({ error: "prezzo non trovato nella pagina" }, { status: 404 });
    return NextResponse.json({ price });
  } catch {
    return NextResponse.json({ error: "impossibile leggere la pagina" }, { status: 502 });
  }
}
