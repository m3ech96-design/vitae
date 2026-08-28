"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, GitBranch, PawPrint, LayoutGrid, Orbit } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { RelationshipMedallion } from "@/components/rapporti/RelationshipMedallion";
import { RelationshipConstellation } from "@/components/rapporti/RelationshipConstellation";
import { FamilyMenu } from "@/components/rapporti/FamilyMenu";

type SortMode = "amicizia" | "inimicizia";
type MainTab = "rapporti" | "albero";
type ViewMode = "griglia" | "costellazione";

const TABS: { id: MainTab; label: string; icon: typeof Sparkles }[] = [
  { id: "rapporti", label: "Rapporti", icon: Sparkles },
  { id: "albero", label: "Albero", icon: GitBranch },
];

export default function RapportiPage() {
  const { hydrated, people } = useHousehold();
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const router = useRouter();
  const [tab, setTab] = useState<MainTab>("rapporti");
  const [sort, setSort] = useState<SortMode>("amicizia");
  const [onlyAnimals, setOnlyAnimals] = useState(false);
  const [view, setView] = useState<ViewMode>("griglia");

  const sortedForRapporti = useMemo(() => {
    let arr = onlyAnimals ? people.filter((p) => ANIMAL_KINDS.includes(p.kind)) : [...people];
    arr = [...arr].sort((a, b) => (sort === "amicizia" ? b.relationshipScore - a.relationshipScore : a.relationshipScore - b.relationshipScore));
    return arr;
  }, [people, sort, onlyAnimals]);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Legami</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Come Stanno Le Cose Tra Voi</h1>

      <div className="mt-5 flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
              tab === id ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "rapporti" && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setSort("amicizia")}
              className={`focus-ring rounded-full border px-3.5 py-2 text-xs transition ${
                sort === "amicizia" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              Più Amicizia
            </button>
            <button
              onClick={() => setSort("inimicizia")}
              className={`focus-ring rounded-full border px-3.5 py-2 text-xs transition ${
                sort === "inimicizia" ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              Più Inimicizia
            </button>
            <button
              onClick={() => setOnlyAnimals((v) => !v)}
              className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
                onlyAnimals ? "border-aura-amber/60 bg-aura-amber/15 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              <PawPrint size={13} /> Solo Animali
            </button>
            <button
              onClick={() => setView((v) => (v === "griglia" ? "costellazione" : "griglia"))}
              className="focus-ring ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-ink-600 transition hover:text-ink-200"
              title={view === "griglia" ? "Passa Alla Costellazione" : "Passa Alla Griglia"}
            >
              {view === "griglia" ? <Orbit size={13} /> : <LayoutGrid size={13} />}
              {view === "griglia" ? "Costellazione" : "Griglia"}
            </button>
          </div>

          {sortedForRapporti.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <Sparkles size={22} className="text-ink-800" />
              <p className="text-sm text-ink-600">Non Hai Ancora Nessun Rapporto Da Coltivare.</p>
            </div>
          ) : view === "griglia" ? (
            <div className="mt-8 grid grid-cols-3 gap-y-7 gap-x-2">
              {sortedForRapporti.map((p) => (
                <RelationshipMedallion
                  key={p.id}
                  person={p}
                  isPartner={profile.partnerPersonId === p.id}
                  onOpen={() => router.push(`/rapporti/${p.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <RelationshipConstellation
                people={sortedForRapporti}
                isPartnerId={profile.partnerPersonId ?? null}
                tasks={tasks}
                places={places}
                onShowAll={() => setView("griglia")}
              />
            </div>
          )}
        </>
      )}

      {tab === "albero" && (
        <div className="mt-6">
          <FamilyMenu />
        </div>
      )}
    </div>
  );
}
