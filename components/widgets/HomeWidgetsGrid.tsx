"use client";
import { useWidgets } from "@/lib/widgets/widgets-context";
import { WIDGET_MAP } from "@/lib/widgets/registry";
import { WidgetShell } from "./WidgetShell";

export function HomeWidgetsGrid() {
  const { hydrated, placed } = useWidgets();
  if (!hydrated || placed.length === 0) return null;

  return (
    <div className="grid grid-cols-6 gap-3">
      {placed.map((p, index) => {
        const def = WIDGET_MAP[p.widgetId];
        if (!def) return null;
        const Comp = def.Component;
        return (
          <WidgetShell
            key={p.id}
            placedId={p.id}
            title={def.title}
            size={p.size}
            allowedSizes={def.allowedSizes}
            index={index}
            total={placed.length}
            pages={[<Comp key="main" size={p.size} />]}
          />
        );
      })}
    </div>
  );
}
