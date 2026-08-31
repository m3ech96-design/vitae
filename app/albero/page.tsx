"use client";
import { useHousehold } from "@/lib/household-context";
import { FamilyMenu } from "@/components/rapporti/FamilyMenu";

export default function AlberoPage() {
  const { hydrated } = useHousehold();
  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Legami</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Il tuo albero genealogico</h1>

      <div className="mt-6">
        <FamilyMenu />
      </div>
    </div>
  );
}
