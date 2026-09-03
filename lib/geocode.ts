export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Nominatim (OpenStreetMap): nessuna chiave richiesta, adatto a un suggerimento mentre
 * l'utente digita. La richiesta parte solo dal browser dell'utente finale, mai dal nostro
 * server.
 *
 * Nota tecnica sulla policy d'uso di Nominatim: richiede un header User-Agent identificativo
 * dell'app, ma da una fetch() lato browser quell'header è "forbidden" dallo standard Fetch —
 * il browser lo imposta sempre da sé, un valore custom passato qui verrebbe ignorato in
 * silenzio senza dare l'effetto voluto. Una reale conformità richiederebbe instradare questa
 * chiamata attraverso una propria API route (come già fatto per /api/news), dove l'header è
 * impostabile lato server.
 */
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=0&limit=5`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Ricerca indirizzo non riuscita");
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
}

/**
 * Percorso inverso di `searchAddress`: da un punto toccato sulla mappa, prova a risalire
 * a un indirizzo leggibile. Usata solo quando il campo Indirizzo è ancora vuoto — se
 * fallisce (rete, punto senza indirizzo noto) restituisce `null` e chi chiama decide il
 * ripiego, non blocca mai il tocco sulla mappa in sé.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=0`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: { display_name?: string } = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}
