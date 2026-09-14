"use client";
import { Newspaper } from "lucide-react";
import { WidgetList } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";
import { useNews } from "@/lib/use-news";

/** L'id di ogni voce è direttamente il suo link — non un indice arbitrario, che non
 * identificherebbe nulla di stabile a cui agganciare l'apertura. Apriamo in una scheda
 * nuova (non una navigazione interna: è un URL esterno) così il widget e la Home restano
 * esattamente dove erano, coerente con l'idea di poter agire senza perdere il contesto. */
function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LatestNewsWidget({ size }: { size: WidgetSize }) {
  const { categories } = useNews();

  const allRecent = (categories ?? [])
    .flatMap((c) => c.items.slice(0, 2))
    .sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""));
  const items = allRecent.slice(0, 4).map((it) => ({ id: it.link, label: it.title }));

  return (
    <WidgetList
      title="Ultime notizie"
      icon={Newspaper}
      items={items}
      totalCount={allRecent.length}
      emptyLabel={categories === null ? "Carico..." : "Nessuna notizia"}
      onItemOpen={openInNewTab}
    />
  );
}

export function TodayDigestWidget({ size }: { size: WidgetSize }) {
  const { categories } = useNews();

  const today = new Date().toISOString().slice(0, 10);
  const allToday = (categories ?? [])
    .flatMap((c) => c.items)
    .filter((it) => (it.pubDate || "").slice(0, 10) === today)
    .sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""));
  const items = allToday.slice(0, 6).map((it) => ({ id: it.link, label: it.title }));

  return (
    <WidgetList
      title="Solo di oggi"
      icon={Newspaper}
      items={items}
      totalCount={allToday.length}
      emptyLabel={categories === null ? "Carico..." : "Niente pubblicato oggi"}
      onItemOpen={openInNewTab}
    />
  );
}
