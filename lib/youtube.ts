/** Estrae l'id video da un URL YouTube in una qualunque delle sue forme comuni (watch,
 * youtu.be, shorts, embed) — stessa logica già usata per gli embed di Vitaecom
 * (vitaecom-link-detect.ts), isolata qui perché qui serve solo YouTube, non anche Vimeo o
 * link generici. Restituisce null se l'URL non è valido o non è un link YouTube. */
export function youtubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
  if (url.hostname.includes("youtube.com")) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
  }
  return null;
}

export function isValidYoutubeUrl(rawUrl: string): boolean {
  return youtubeVideoId(rawUrl) !== null;
}
