"use client";
import { HouseholdMessageBar } from "../../home/HouseholdMessageBar";
import { WidgetSize } from "@/lib/widgets/types";

/** Stesso componente già usato sotto il riquadro Casa — qui semplicemente ospitato dentro
 * un widget, come richiesto esplicitamente per i widget "azione rapida". */
export function QuickHouseholdMessageWidget({ size }: { size: WidgetSize }) {
  return (
    <div className="flex h-full items-center">
      <HouseholdMessageBar />
    </div>
  );
}
