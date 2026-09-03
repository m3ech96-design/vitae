"use client";
import { useHouseholdMessages } from "@/lib/household-messages-context";
import { HouseholdMessageCard } from "./HouseholdMessageCard";

/** Le notifiche di casa si interpongono sempre subito sotto la card del profilo — mai
 * attaccate, un piccolo margine sopra basta a non farle sembrare parte della stessa card. */
export function HouseholdMessagesFeed() {
  const { hydrated, messages } = useHouseholdMessages();
  if (!hydrated || messages.length === 0) return null;

  const sorted = [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mt-4 space-y-2">
      {sorted.map((m) => (
        <HouseholdMessageCard key={m.id} message={m} />
      ))}
    </div>
  );
}
