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
 *
 * ECCEZIONE NECESSARIA — Amazon: le pagine prodotto di Amazon non pubblicano nessuno dei tre
 * standard sopra (niente JSON-LD Product/Offer con prezzo, niente meta OG price) — è un
 * fatto del suo markup, non un caso limite raro, quindi senza un estrattore dedicato ogni
 * URL Amazon fallisce sempre, sistematicamente, con "prezzo non trovato". Amazon espone il
 * prezzo in classi proprietarie stabili nel tempo (`a-price-whole`/`a-price-fraction` per le
 * due metà del prezzo, `a-offscreen` come stringa unica di riserva per la lettura da
 * screen-reader) — vedi extractAmazonPrice più sotto, provato solo quando il dominio è
 * Amazon e solo dopo aver già cercato invano gli standard universali.
 */

function isAmazonHost(hostname: string): boolean {
  return /(^|\.)amazon\.[a-z.]+$/i.test(hostname);
}

function extractAmazonPrice(html: string): number | null {
  // Preferita: whole + frazione separati (il formato più comune sulle pagine prodotto).
  const whole = html.match(/class=["'][^"']*\ba-price-whole\b[^"']*["'][^>]*>\s*([\d.,]+)/i);
  if (whole) {
    const fraction = html.match(/class=["'][^"']*\ba-price-fraction\b[^"']*["'][^>]*>\s*(\d+)/i);
    const wholePart = whole[1].replace(/[.,]/g, "");
    const price = parseFloat(fraction ? `${wholePart}.${fraction[1]}` : wholePart);
    if (!Number.isNaN(price) && price > 0) return price;
  }
  // Riserva: la stringa unica pensata per screen-reader, es. "€19,99" o "$19.99".
  const offscreenMatches = html.matchAll(/class=["'][^"']*\ba-offscreen\b[^"']*["'][^>]*>\s*[^\d]*([\d.,]+)/gi);
  for (const m of offscreenMatches) {
    const normalized = m[1].includes(",") && m[1].lastIndexOf(",") > m[1].lastIndexOf(".") ? m[1].replace(/\./g, "").replace(",", ".") : m[1].replace(/,/g, "");
    const price = parseFloat(normalized);
    if (!Number.isNaN(price) && price > 0) return price;
  }
  return null;
}

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
        // Molti siti negano la pagina a richieste senza uno User-Agent "da browser" — non è
        // un tentativo di mascherare la natura della richiesta, solo evitare un blocco banale
        // rivolto ai bot senza alcuno User-Agent affatto. Amazon in particolare è più severo
        // di altri siti e un header troppo scarno (privo di Accept-Language) rende più
        // probabile ricevere una pagina di verifica anti-bot invece del prodotto vero.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ error: "pagina non raggiungibile" }, { status: 502 });

    const html = await res.text();
    const price =
      extractJsonLdPrice(html) ??
      extractMetaPrice(html, "product:price:amount") ??
      extractMetaPrice(html, "og:price:amount") ??
      (isAmazonHost(parsedUrl.hostname) ? extractAmazonPrice(html) : null);

    if (price === null) return NextResponse.json({ error: "prezzo non trovato nella pagina" }, { status: 404 });
    return NextResponse.json({ price });
  } catch {
    return NextResponse.json({ error: "impossibile leggere la pagina" }, { status: 502 });
  }
}
