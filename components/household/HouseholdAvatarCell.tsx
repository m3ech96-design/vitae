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
  const { updatePerson, home } = useHousehold();
  const { places } = usePlaces();
  const [asleep, setAsleep] = useState(false);
  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const engagement = currentEngagement(person);
  const engagementPlace = engagement?.linkedPlaceId ? places.find((p) => p.id === engagement.linkedPlaceId) ?? null : null;
  // Il Place "Casa" vero (non un badge fisso a parte): stesso elenco condiviso `places`,
  // così l'icona resta coerente con quella usata ovunque altrove per quel luogo.
  const homePlace = home ? places.find((p) => p.id === home.placeId) ?? null : null;

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
    // Prima era un <button>: un <button> dentro l'altro (il badge "Fame" interattivo, appena
    // introdotto qui sotto, ne rende uno suo) non è HTML valido — lo stesso bug già corretto
    // altrove nell'app (vedi PersonalCardMenu, PersonCard) per lo stesso identico motivo. Un
    // <div> col ruolo giusto risolve senza perdere accessibilità.
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (asleep) {
          wake(e);
          return;
        }
        onOpen(person);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (asleep) {
          const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          updatePerson(person.id, { wakeUntil: until });
          return;
        }
        onOpen(person);
      }}
      className="focus-ring flex flex-col items-center gap-1.5"
    >
      <div className={asleep ? "relative opacity-70 transition-opacity" : "relative transition-opacity"}>
        {isAnimal && !asleep && isHungry(person) ? (
          // Corretto secondo le istruzioni: prima non era mai interattivo qui — toccare
          // l'avatar apriva sempre e solo la scheda della persona, la lista del cibo restava
          // scritta ma irraggiungibile da questo riquadro.
          <HungryBadge person={person} interactive />
        ) : (
          !asleep &&
          (location === "casa" ? (
            // Corretto secondo le istruzioni: prima, quando semplicemente a casa senza un
            // Impegno in corso, non c'era alcuna icona in alto a destra — un buco muto
            // rispetto a quando invece si era fuori casa. Ora c'è sempre un'icona: quella
            // del proprio Luogo Casa quando dentro, quella del Luogo (o del mondo) quando
            // fuori — vedi il ramo sotto.
            <PlaceIconBadge place={homePlace} size={60} />
          ) : (
            // Corretto secondo le istruzioni: fuori casa non significa più un'aura rossa
            // d'allarme (vedi ring qui sotto, ora sempre "home") — resta solo l'indizio
            // preciso di dove ci si trova: il Luogo collegato se c'è (anche se salvato solo
            // tra i Luoghi di questo familiare, non tra quelli dell'utente principale — è lo
            // stesso elenco condiviso `places`, nessuna distinzione tecnica tra i due), o
            // altrimenti un mondo a indicare "in giro, in un posto non salvato".
            <PlaceIconBadge place={engagementPlace} size={60} showWorldFallback />
          ))
        )}
        <AuraAvatar
          imageUrl={person.avatarUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          size={60}
          ring={asleep ? "sleep" : "home"}
          shape={isAnimal ? "squircle" : "circle"}
          layoutId={`person-avatar-${person.id}`}
          deceased={person.deceased}
        />
      </div>
      <span className="max-w-[64px] truncate text-[11px] text-ink-600">{person.firstName}</span>
    </div>
  );
}
