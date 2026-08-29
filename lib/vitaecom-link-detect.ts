const URL_PATTERN = /https?:\/\/[^\s]+/i;

export interface DetectedLink {
  url: string;
  kind: "youtube" | "vimeo" | "generic";
  /** Solo per YouTube/Vimeo — l'id video da passare all'iframe di embed. */
  videoId?: string;
  domain: string;
}

function youtubeId(url: URL): string | null {
  if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
  if (url.hostname.includes("youtube.com")) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
  }
  return null;
}

function vimeoId(url: URL): string | null {
  if (!url.hostname.includes("vimeo.com")) return null;
  const match = url.pathname.match(/\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Il primo link riconoscibile dentro il testo di un post — non serve un campo a parte nel
 * compositore: se scrivi o incolli un link, resta lì nel testo e viene anche riconosciuto,
 * come fanno la maggior parte dei social. YouTube e Vimeo diventano un vero player
 * incorporato (`kind: "youtube"/"vimeo"`, con l'id pronto per l'iframe); qualunque altro
 * link (Facebook compreso — la loro embed vera richiede il loro SDK e una pagina pubblica
 * raggiungibile, non disponibile qui) resta una card col dominio e un pulsante per aprirlo,
 * non un tentativo di embed rotto.
 */
export function detectLink(text: string): DetectedLink | null {
  const match = text.match(URL_PATTERN);
  if (!match) return null;
  let url: URL;
  try {
    url = new URL(match[0].replace(/[).,!?]+$/, ""));
  } catch {
    return null;
  }

  const yt = youtubeId(url);
  if (yt) return { url: url.toString(), kind: "youtube", videoId: yt, domain: "youtube.com" };

  const vim = vimeoId(url);
  if (vim) return { url: url.toString(), kind: "vimeo", videoId: vim, domain: "vimeo.com" };

  return { url: url.toString(), kind: "generic", domain: url.hostname.replace(/^www\./, "") };
}
