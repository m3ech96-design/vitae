"use client";
import { Person } from "@/lib/types";
import { ANIMAL_CHARACTER, ANIMAL_INTERESTS, ANIMAL_HABITS } from "@/lib/animal-lists";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { TagMultiSelect } from "../wizard/TagMultiSelect";
import { FeedingScheduleEditor } from "./FeedingScheduleEditor";

export function AnimalCareSection({
  person,
  onUpdate,
}: {
  person: Person;
  onUpdate: (patch: Partial<Person>) => void;
}) {
  const { people } = useHousehold();
  const { profile } = useProfile();
  const otherPeople = people.filter((p) => p.id !== person.id);

  const changeOwner = (ownerId: string) => {
    const owner = people.find((p) => p.id === ownerId);
    const ownerLivesAtHome = ownerId === "user" || Boolean(owner?.livesAtHome);
    onUpdate({ ownerId, livesAtHome: ownerLivesAtHome });
  };

  return (
    <div className="space-y-7">
      <label className="block">
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Chi è il padrone?
        </span>
        <select
          value={person.ownerId || "user"}
          onChange={(e) => changeOwner(e.target.value)}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
        >
          <option value="user" className="bg-void-800">
            {profile.firstName ? `Io (${profile.firstName})` : "Io"}
          </option>
          {otherPeople.map((p) => (
            <option key={p.id} value={p.id} className="bg-void-800">
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
      </label>

      <FeedingScheduleEditor
        times={person.feedingTimes}
        onChange={(feedingTimes) => onUpdate({ feedingTimes })}
        log={person.feedingLog}
      />
      <TagMultiSelect
        label="Carattere"
        options={ANIMAL_CHARACTER}
        selected={person.animalCharacter}
        onChange={(animalCharacter) => onUpdate({ animalCharacter })}
      />
      <TagMultiSelect
        label="Interessi"
        options={ANIMAL_INTERESTS}
        selected={person.animalInterests}
        onChange={(animalInterests) => onUpdate({ animalInterests })}
      />
      <TagMultiSelect
        label="Abitudini"
        options={ANIMAL_HABITS}
        selected={person.animalHabits}
        onChange={(animalHabits) => onUpdate({ animalHabits })}
      />
    </div>
  );
}
