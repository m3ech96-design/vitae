"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Users } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { toFamilyEntities } from "@/lib/family-entities";
import { groupFamilies } from "@/lib/family-relations";
import { AuraAvatar } from "../ui/AuraAvatar";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";

export function FamilyMenu() {
  const { profile } = useProfile();
  const { people } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const router = useRouter();
  const [sortByKinship, setSortByKinship] = useState(true);

  const entities = useMemo(() => toFamilyEntities(profile, people), [profile, people]);
  const groups = useMemo(() => groupFamilies(entities), [entities]);
  const groupedIds = new Set(groups.flatMap((g) => g.ids));
  const ungrouped = entities.filter((e) => !groupedIds.has(e.id));

  const byId = new Map(entities.map((e) => [e.id, e]));
  const goTo = (id: string) => router.push(`/rapporti/albero/${id}`);
  // L'utente non può "dimenticare" se stesso: alone sempre a piena intensità per "Tu".
  const intensityOf = (id: string) => {
    const p = people.find((x) => x.id === id);
    return p ? auraIntensity(p, tasks, places) : 1;
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-ink-600">
          <GitBranch size={13} /> Tocca Un Avatar Per Entrare Nel Suo Albero
        </p>
        <button
          onClick={() => setSortByKinship((v) => !v)}
          className={`focus-ring rounded-full border px-3 py-1.5 text-[11px] transition ${
            sortByKinship ? "border-aura-amber/60 bg-aura-amber/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          Per Parentela
        </button>
      </div>

      {sortByKinship ? (
        <div className="space-y-8">
          {groups.map((g, i) => (
            <div key={i}>
              <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                Famiglia {g.surnames.join(", ")}
              </p>
              <div className="grid grid-cols-4 gap-4">
                {g.ids.map((id) => {
                  const e = byId.get(id);
                  if (!e) return null;
                  return (
                    <button key={id} onClick={() => goTo(id)} className="focus-ring flex flex-col items-center gap-1.5">
                      <AuraAvatar imageUrl={e.avatarUrl} firstName={e.firstName} lastName={e.lastName} size={58} ring="idle" glowColor={personColor(e.id)} glowIntensity={intensityOf(e.id)} deceased={e.deceased} />
                      <p className="max-w-[64px] truncate text-center text-[10px] text-ink-300">
                        {id === "user" ? "Tu" : e.firstName}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                <Users size={12} /> Senza Famiglia Collegata
              </p>
              <div className="grid grid-cols-4 gap-4">
                {ungrouped.map((e) => (
                  <button key={e.id} onClick={() => goTo(e.id)} className="focus-ring flex flex-col items-center gap-1.5">
                    <AuraAvatar imageUrl={e.avatarUrl} firstName={e.firstName} lastName={e.lastName} size={58} ring="idle" glowColor={personColor(e.id)} glowIntensity={intensityOf(e.id)} deceased={e.deceased} />
                    <p className="max-w-[64px] truncate text-center text-[10px] text-ink-300">
                      {e.id === "user" ? "Tu" : e.firstName}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {entities.map((e) => (
            <button key={e.id} onClick={() => goTo(e.id)} className="focus-ring flex flex-col items-center gap-1.5">
              <AuraAvatar imageUrl={e.avatarUrl} firstName={e.firstName} lastName={e.lastName} size={58} ring="idle" glowColor={personColor(e.id)} glowIntensity={intensityOf(e.id)} deceased={e.deceased} />
              <p className="max-w-[64px] truncate text-center text-[10px] text-ink-300">
                {e.id === "user" ? "Tu" : e.firstName}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
