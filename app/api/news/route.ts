import { NextRequest, NextResponse } from "next/server";
import { NEWS_CATEGORIES, NEWS_SOURCES_BY_ID } from "@/lib/news-sources-catalog";

/**
 * Corretto secondo le istruzioni: prima questa route aveva quattro fonti fisse, tutte ANSA,
 * decise qui nel codice — esattamente l'automatismo che le istruzioni vietano ("non voglio che
 * sia l'app a scegliere per l'utente le news che deve guardare"). Ora la route non decide più
 * nulla: riceve la lista di fonti che l'utente ha scelto (vedi lib/news-sources-context.tsx,
 * popolato dalla schermata "Gestisci fonti") tramite `?sources=id1,id2,...`, fa il fetch SOLO
 * di quelle, e raggruppa i risultati per categoria — mai l'inverso. Nessuna fonte selezionata
 * vuol dire nessuna notizia, di proposito: la schermata News lo spiega e rimanda a scegliere.
 *
 * Il fetch gira lato server per lo stesso motivo di sempre: un fetch dal browser verso decine
 * di domini diversi incontrerebbe quasi ovunque il CORS della fonte.
 *
 * Nota onesta sui limiti: ogni fonte nel catalogo è una testata reale con il suo feed RSS
 * pubblico più noto, ma un indirizzo RSS può cambiare nel tempo senza preavviso — una fonte
 * che non risponde più mostra semplicemente zero notizie sue, mai un errore che blocca le
 * altre fonti scelte nella stessa categoria (vedi il try/catch per singola fonte qui sotto).
 * Ogni notizia porta solo titolo e la breve descrizione già presente nel feed (mai il testo
 * integrale dell'articolo), e rimanda sempre all'articolo vero sul sito della testata per
 * leggerlo per intero.
 */

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  imageUrl?: string;
  sourceName: string;
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

function parseRss(xml: string, sourceName: string, max = 10): NewsItem[] {
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
      sourceName,
    });
  }
  return items;
}

/** Quando l'RSS non porta già un'immagine (niente enclosure/media:content/img nella
 * descrizione — capita spesso), va presa dalla pagina dell'articolo vero: prima il tag
 * `og:image`, poi `twitter:image` come ripiego, poi la prima `<img>` trovata nella pagina come
 * ultima spiaggia. Timeout breve e a prova di errore: un sito lento o irraggiungibile non deve
 * mai bloccare né far fallire il resto delle news. */
async function fetchArticleImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VitaeApp/1.0; personal RSS reader)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return undefined;
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < 60000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    const firstImg = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const found = og?.[1] || tw?.[1] || firstImg?.[1];
    if (!found) return undefined;
    try {
      return new URL(found, url).toString();
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

async function fetchSource(sourceId: string): Promise<NewsItem[]> {
  const source = NEWS_SOURCES_BY_ID.get(sourceId);
  if (!source) return [];
  try {
    const res = await fetch(source.rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VitaeApp/1.0; personal RSS reader)" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRss(xml, source.name);
    // Solo per chi non ha già un'immagine dall'RSS stesso — mai un fetch in più quando non
    // serve.
    return await Promise.all(
      items.map(async (item) => (item.imageUrl ? item : { ...item, imageUrl: await fetchArticleImage(item.link) }))
    );
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const sourcesParam = request.nextUrl.searchParams.get("sources") ?? "";
  const requestedIds = [...new Set(sourcesParam.split(",").map((s) => s.trim()).filter(Boolean))];
  // Solo id realmente presenti nel catalogo — un id sconosciuto (versione vecchia salvata,
  // fonte rimossa dal catalogo) viene ignorato invece di far fallire l'intera richiesta.
  const validIds = requestedIds.filter((id) => NEWS_SOURCES_BY_ID.has(id));

  if (validIds.length === 0) {
    return NextResponse.json({ categories: [], fetchedAt: new Date().toISOString() });
  }

  const perSourceItems = await Promise.all(validIds.map((id) => fetchSource(id)));

  const labelById = new Map(NEWS_CATEGORIES.map((c) => [c.id, c.label]));
  const byCategory = new Map<string, NewsItem[]>();
  validIds.forEach((id, i) => {
    const source = NEWS_SOURCES_BY_ID.get(id)!;
    const existing = byCategory.get(source.category) ?? [];
    byCategory.set(source.category, [...existing, ...perSourceItems[i]]);
  });

  const categories: NewsCategory[] = [...byCategory.entries()]
    .map(([id, items]) => ({
      id,
      label: labelById.get(id) ?? id,
      // Più fonti nella stessa categoria si mescolano per data, non una dopo l'altra a
      // blocchi — così la categoria è davvero "le notizie di quell'argomento", non "prima
      // tutte quelle del primo giornale scelto".
      items: items.sort((a, b) => new Date(b.pubDate ?? 0).getTime() - new Date(a.pubDate ?? 0).getTime()),
    }))
    .filter((c) => c.items.length > 0);

  return NextResponse.json({ categories, fetchedAt: new Date().toISOString() });
}
