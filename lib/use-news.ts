import { useEffect, useState } from "react";
import type { NewsCategory } from "@/app/api/news/route";

export type { NewsItem, NewsCategory } from "@/app/api/news/route";

/**
 * Corretto secondo le istruzioni: prima ogni consumer di /api/news (la pagina News e due
 * widget della Home) faceva il proprio fetch indipendente con il proprio useEffect — se un
 * utente aveva entrambi i widget in Home e visitava anche /news, lo stesso endpoint veniva
 * richiamato fino a 3 volte per lo stesso caricamento. I widget, inoltre, ridefinivano
 * localmente NewsItem/NewsCategory come un sottoinsieme incompleto dei tipi reali della
 * route (mancavano description e imageUrl) — se la route fosse cambiata forma, i widget non
 * se ne sarebbero accorti nemmeno a compile time.
 *
 * Una singola cache module-level (non React state) è condivisa da ogni chiamata di questo
 * hook nella sessione corrente: il primo consumer che monta fa il fetch, tutti gli altri
 * (stesso render o render successivi, finché la pagina resta aperta) ricevono lo stesso
 * risultato senza richiamare la rete. La cache dell'HTTP lato server (`revalidate: 600` nella
 * route) resta comunque il livello che tiene i dati aggiornati nel tempo — questa è solo per
 * evitare richieste duplicate nella stessa sessione del browser.
 */
let cache: NewsCategory[] | null = null;
let inFlight: Promise<NewsCategory[]> | null = null;

function fetchNews(): Promise<NewsCategory[]> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;
  inFlight = fetch("/api/news")
    .then((r) => r.json())
    .then((data) => {
      const categories: NewsCategory[] = data.categories ?? [];
      cache = categories;
      return categories;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function useNews(): { categories: NewsCategory[] | null; error: boolean } {
  const [categories, setCategories] = useState<NewsCategory[] | null>(cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cache) {
      setCategories(cache);
      return;
    }
    let cancelled = false;
    fetchNews()
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, error };
}
