"use client";
import { ListChecks, LineChart, Package, Swords, Library, Layers } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { inventoryTotalValue, matchRecord } from "@/lib/hobby-stats";
import { MetricBlock, MatchesBlock, LibraryBlock } from "@/lib/hobby-types";
import { WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function NextHobbyActivityWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  for (const h of hobbies) {
    for (const b of h.blocks) {
      if (b.kind !== "checklist") continue;
      const next = [...b.items]
        .filter((i) => i.status !== "fatta")
        .sort((a, b2) => (a.dueDate ?? a.createdAt).localeCompare(b2.dueDate ?? b2.createdAt))[0];
      if (next) return <WidgetStat icon={ListChecks} value={next.title} label={h.name} color="#00E5C7" />;
    }
  }
  return <WidgetEmpty icon={ListChecks} label="Nessuna attività da fare" />;
}

export function LastMetricProgressWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  const allEntries = hobbies.flatMap((h) =>
    (h.blocks.filter((b) => b.kind === "metrica") as MetricBlock[]).flatMap((b) =>
      b.entries.map((e) => ({ date: e.date, value: e.value, unit: b.unit, hobby: h.name }))
    )
  );
  const best = [...allEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!best) return <WidgetEmpty icon={LineChart} label="Nessuna metrica registrata" />;
  return <WidgetStat icon={LineChart} value={`${best.value} ${best.unit}`} label={best.hobby} color="#7C5CFF" />;
}

export function LastMatchWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  const allMatches = hobbies.flatMap((h) =>
    (h.blocks.filter((b) => b.kind === "partite") as MatchesBlock[]).flatMap((b) =>
      b.matches.map((m) => ({ date: m.date, result: m.result, hobby: h.name }))
    )
  );
  const last = [...allMatches].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return <WidgetEmpty icon={Swords} label="Nessuna partita registrata" />;
  const color = last.result === "vittoria" ? "#34D399" : last.result === "sconfitta" ? "#FF4D6D" : "#FFB454";
  return (
    <WidgetStat
      icon={Swords}
      value={last.result === "vittoria" ? "Vittoria" : last.result === "sconfitta" ? "Sconfitta" : "Pareggio"}
      label={last.hobby}
      color={color}
    />
  );
}

export function CollectionValueWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  for (const h of hobbies) {
    const inv = h.blocks.find((b) => b.kind === "inventario");
    if (inv && inv.kind === "inventario" && inv.items.length > 0) {
      return <WidgetStat icon={Package} value={`${Math.round(inventoryTotalValue(inv))}€`} label={`${h.name} · valore collezione`} color="#FFB454" />;
    }
  }
  return <WidgetEmpty icon={Package} label="Nessuna collezione ancora" />;
}

export function WinRateWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  for (const h of hobbies) {
    const block = h.blocks.find((b) => b.kind === "partite");
    if (block && block.kind === "partite" && block.matches.length > 0) {
      const rec = matchRecord(block);
      return <WidgetStat icon={Swords} value={`${Math.round(rec.winRatePct)}%`} label={`${h.name} · vittorie`} color="#34D399" />;
    }
  }
  return <WidgetEmpty icon={Swords} label="Nessuna partita ancora" />;
}

export function LastLibraryItemWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  const allItems = hobbies.flatMap((h) =>
    (h.blocks.filter((b) => b.kind === "libreria") as LibraryBlock[]).flatMap((b) =>
      b.items.map((item) => ({ title: item.title, hobby: h.name, createdAt: item.createdAt }))
    )
  );
  const last = [...allItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!last) return <WidgetEmpty icon={Library} label="Nessuna voce in libreria" />;
  return <WidgetStat icon={Library} value={last.title} label={last.hobby} color="#5EC8FF" />;
}

export function MostActiveHobbyWidget({ size }: { size: WidgetSize }) {
  const { hobbies } = useHobby();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoIso = monthAgo.toISOString().slice(0, 10);

  const counted = hobbies.map((h) => {
    let count = 0;
    h.blocks.forEach((b) => {
      if (b.kind === "checklist") count += b.items.filter((i) => i.createdAt >= monthAgoIso).length;
      if (b.kind === "metrica") count += b.entries.filter((e) => e.date >= monthAgoIso).length;
      if (b.kind === "partite") count += b.matches.filter((m) => m.date >= monthAgoIso).length;
      if (b.kind === "progetti") count += b.projects.filter((p) => p.createdAt >= monthAgoIso).length;
    });
    return { name: h.name, count };
  });
  const top = [...counted].sort((a, b) => b.count - a.count)[0];
  if (!top || top.count === 0) return <WidgetEmpty icon={Layers} label="Nessuna attività questo mese" />;
  return <WidgetStat icon={Layers} value={top.name} label={`${top.count} voci questo mese`} color="#7C5CFF" />;
}
