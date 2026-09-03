"use client";
import { Newspaper } from "lucide-react";
import { WidgetList } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";
import { useNews } from "@/lib/use-news";

export function LatestNewsWidget({ size }: { size: WidgetSize }) {
  const { categories } = useNews();

  const items = (categories ?? [])
    .flatMap((c) => c.items.slice(0, 2))
    .sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""))
    .slice(0, 4)
    .map((it, i) => ({ id: `${i}`, label: it.title }));

  return <WidgetList title="Ultime notizie" icon={Newspaper} items={items} emptyLabel={categories === null ? "Carico..." : "Nessuna notizia"} />;
}

export function TodayDigestWidget({ size }: { size: WidgetSize }) {
  const { categories } = useNews();

  const today = new Date().toISOString().slice(0, 10);
  const items = (categories ?? [])
    .flatMap((c) => c.items)
    .filter((it) => (it.pubDate || "").slice(0, 10) === today)
    .sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""))
    .slice(0, 6)
    .map((it, i) => ({ id: `${i}`, label: it.title }));

  return <WidgetList title="Solo di oggi" icon={Newspaper} items={items} emptyLabel={categories === null ? "Carico..." : "Niente pubblicato oggi"} />;
}
