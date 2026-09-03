import { useEffect, useState } from "react";
import type { NewsCategory } from "@/app/api/news/route";
import { useNewsSources } from "./news-sources-context";

export type { NewsItem, NewsCategory } from "@/app/api/news/route";

/**
 * Corretto secondo le istruzioni: le news ora dipendono da QUALI fonti l'utente ha scelto
 * (vedi lib/news-sources-context.tsx) — non più un fetch unico e fisso. La cache module-level
 * (stesso principio di prima: un solo fetch condiviso da ogni consumer nella sessione, mai uno
 * per widget) è quindi tenuta per chiave, la lista ordinata degli id scelti unita in una
 * stringa: cambiare la selezione delle fonti è una chiave diversa, e rifà il fetch; la stessa
 * selezione, richiesta da più punti (la pagina News, i widget della Home), resta condivisa.
 */
const cache = new Map<string, NewsCategory[]>();
const inFlight = new Map<string, Promise<NewsCategory[]>>();

function fetchNews(key: string, ids: string[]): Promise<NewsCategory[]> {
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const promise = fetch(`/api/news?sources=${encodeURIComponent(ids.join(","))}`)
    .then((r) => r.json())
    .then((data) => {
      const categories: NewsCategory[] = data.categories ?? [];
      cache.set(key, categories);
      return categories;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

export function useNews(): { categories: NewsCategory[] | null; error: boolean; hasSelection: boolean } {
  const { hydrated, selectedIds } = useNewsSources();
  const key = [...selectedIds].sort().join(",");
  const [categories, setCategories] = useState<NewsCategory[] | null>(cache.get(key) ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedIds.length === 0) {
      setCategories([]);
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setCategories(cached);
      return;
    }
    setCategories(null);
    setError(false);
    let cancelled = false;
    fetchNews(key, selectedIds)
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  return { categories, error, hasSelection: selectedIds.length > 0 };
}
