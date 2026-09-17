import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy verso Open-Meteo (https://api.open-meteo.com) — gratuita, senza chiave API, dati
 * dichiaratamente liberi anche per uso non commerciale. Gira lato server per lo stesso
 * motivo di app/api/wishlist-price/route.ts: centralizzare la costruzione dell'URL e la
 * validazione dei parametri in un solo punto, invece di lasciare che il client componga da
 * sé una query string verso un dominio esterno.
 *
 * Chiede sia `current` (il meteo di adesso) sia `hourly` per una finestra di 3 giorni
 * (oggi + i 2 successivi, come richiesto: "fino a 2 giorni dopo") — un'unica chiamata
 * invece di due, dato che Open-Meteo restituisce entrambi i blocchi nella stessa risposta.
 * `timezone=auto` fa risolvere a Open-Meteo stesso il fuso orario dalla lat/lng ricevuta,
 * così gli orari nella risposta sono già locali al luogo richiesto — niente conversioni di
 * fuso da fare qui o sul client.
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  if (Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return NextResponse.json({ error: "Coordinate mancanti o non valide." }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latNum.toString());
  url.searchParams.set("longitude", lngNum.toString());
  url.searchParams.set("current", "temperature_2m,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "temperature_2m,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 600 } });
    if (!response.ok) {
      return NextResponse.json({ error: "Servizio meteo non raggiungibile al momento." }, { status: 502 });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Servizio meteo non raggiungibile al momento." }, { status: 502 });
  }
}
