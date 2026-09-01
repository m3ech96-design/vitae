import { NextResponse } from "next/server";

/**
 * Le news "dal momento" arrivano da RSS pubblici veri (ANSA, un'agenzia di stampa, non un
 * singolo giornale schierato) — girano lato server apposta: un fetch dal browser verso un
 * altro dominio verrebbe quasi certamente bloccato dal CORS della fonte, qui non c'è quel
 * problema.
 *
 * Nota onesta sui limiti d'uso di ANSA: il loro stesso servizio RSS dichiara di essere
 * pensato "per fini non commerciali... per la sola visualizzazione mediante... Reader" — cioè
 * esattamente quello che questa scheda fa (un lettore RSS personale per un solo utente, mai
 * distribuito né monetizzato), non una ripubblicazione dei loro contenuti come se fossero
 * nostri: ogni notizia porta solo titolo e la breve descrizione già presente nel feed
 * (mai il testo integrale dell'articolo, che ANSA non mette nemmeno nell'RSS), e rimanda
 * sempre all'articolo vero sul loro sito per leggerlo per intero.
 */

interface FeedDef {
  id: string;
  label: string;
  url: string;
}

const FEEDS: FeedDef[] = [
  { id: "attualita", label: "Attualità", url: "https://www.ansa.it/sito/ansait_rss.xml" },
  { id: "cronaca", label: "Cronaca", url: "https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml" },
  { id: "cultura", label: "Cultura", url: "https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml" },
  { id: "tecnologia", label: "Tecnologia", url: "https://www.ansa.it/canale_tecnologia/notizie/tecnologia_rss.xml" },
];

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  imageUrl?: string;
}

export interface NewsCategory {
  id: string;
  label: string;
  items: NewsItem[];
}

function extractTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : null;
}

function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&agrave;/g, "à")
    .replace(/&egrave;/g, "è")
    .replace(/&eacute;/g, "é")
    .replace(/&igrave;/g, "ì")
    .replace(/&ograve;/g, "ò")
    .replace(/&ugrave;/g, "ù")
    .trim();
}

function parseRss(xml: string, max = 14): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) && items.length < max) {
    const block = m[1];
    const rawTitle = extractTag(block, "title");
    const rawLink = extractTag(block, "link");
    const rawDescription = extractTag(block, "description") ?? "";
    const rawPubDate = extractTag(block, "pubDate");
    if (!rawTitle || !rawLink) continue;

    const enclosure = block.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
    const media = block.match(/<media:content[^>]*url=["']([^"']+)["']/i);
    const imgInDescription = rawDescription.match(/<img[^>]*src=["']([^"']+)["']/i);
    const imageUrl = enclosure?.[1] || media?.[1] || imgInDescription?.[1];

    items.push({
      title: clean(rawTitle),
      description: clean(rawDescription),
      link: clean(rawLink),
      pubDate: rawPubDate ? clean(rawPubDate) : undefined,
      imageUrl,
    });
  }
  return items;
}

export async function GET() {
  const categories = await Promise.all(
    FEEDS.map(async (feed): Promise<NewsCategory> => {
      try {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; VitaeApp/1.0; personal RSS reader)" },
          next: { revalidate: 600 },
        });
        if (!res.ok) return { id: feed.id, label: feed.label, items: [] };
        const xml = await res.text();
        return { id: feed.id, label: feed.label, items: parseRss(xml) };
      } catch {
        return { id: feed.id, label: feed.label, items: [] };
      }
    })
  );

  return NextResponse.json({
    categories: categories.filter((c) => c.items.length > 0),
    source: "ANSA",
    fetchedAt: new Date().toISOString(),
  });
}
