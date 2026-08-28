"use client";
import { useEffect, useState } from "react";
import { Person, ANIMAL_KINDS } from "@/lib/types";
import { isAsleep } from "@/lib/time";
import { isHungry } from "@/lib/feeding";
import { currentEngagement } from "@/lib/presence";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { AuraAvatar } from "../ui/AuraAvatar";
import { PlaceIconBadge } from "../ui/PlaceIconBadge";
import { HungryBadge } from "../animali/HungryBadge";

export function HouseholdAvatarCell({
  person,
  location,
  onOpen,
}: {
  person: Person;
  location: "casa" | "fuori-casa";
  onOpen: (p: Person) => void;
}) {
  const { updatePerson } = useHousehold();
  const { places } = usePlaces();
  const [asleep, setAsleep] = useState(false);
  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const engagement = currentEngagement(person);
  const engagementPlace = engagement?.linkedPlaceId ? places.find((p) => p.id === engagement.linkedPlaceId) ?? null : null;

  useEffect(() => {
    const tick = () => setAsleep(isAsleep(person.wakeUntil));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [person.wakeUntil]);

  const wake = (e: React.MouseEvent) => {
    if (!asleep) return;
    e.stopPropagation();
    const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    updatePerson(person.id, { wakeUntil: until });
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        if (asleep) {
          wake(e);
          return;
        }
        onOpen(person);
      }}
      className="focus-ring flex flex-col items-center gap-1.5"
    >
      <div className={asleep ? "relative opacity-70 transition-opacity" : "relative transition-opacity"}>
        {isAnimal && !asleep && isHungry(person) ? (
          <HungryBadge person={person} />
        ) : (
          !asleep && <PlaceIconBadge place={engagementPlace} size={60} />
        )}
        <AuraAvatar
          imageUrl={person.avatarUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          size={60}
          ring={asleep ? "sleep" : location === "casa" ? "home" : "away"}
          shape={isAnimal ? "squircle" : "circle"}
          layoutId={`person-avatar-${person.id}`}
          deceased={person.deceased}
        />
      </div>
      <span className="max-w-[64px] truncate text-[11px] text-ink-600">{person.firstName}</span>
    </button>
  );
}
