"use client";
import { Phone, MessageCircle } from "lucide-react";
import { Person, PERSON_KIND_LABEL, ANIMAL_KINDS } from "@/lib/types";
import { currentEngagement } from "@/lib/presence";
import { personWorldStatus } from "@/lib/task-presence";
import { totalOutings } from "@/lib/frequency";
import { isHungry } from "@/lib/feeding";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { useProfile } from "@/lib/profile-context";
import { AuraAvatar } from "../ui/AuraAvatar";
import { PlaceIconBadge } from "../ui/PlaceIconBadge";
import { DialogueBubble } from "./DialogueBubble";
import { ActionLine } from "./ActionLine";
import { HungryBadge } from "../animali/HungryBadge";

export function PersonCard({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const { places } = usePlaces();
  const { people, home } = useHousehold();
  const { tasks } = useTasks();
  const { profile } = useProfile();
  const phone = person.phone;
  const waLink = phone ? `https://wa.me/${phone.replace(/[^\d+]/g, "")}` : null;
  const engagement = currentEngagement(person);
  const engagementPlace = engagement?.linkedPlaceId ? places.find((p) => p.id === engagement.linkedPlaceId) ?? null : null;
  const isAnimal = ANIMAL_KINDS.includes(person.kind);

  const status = personWorldStatus(person, tasks, home?.placeId, engagementPlace?.id ?? null);
  const ring = status === "casa" ? "home" : status === "fuori-casa" ? "away" : "world";
  const outings = totalOutings(person.id, tasks, places);

  const ownerName = !person.ownerId
    ? null
    : person.ownerId === "user"
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : (() => {
        const o = people.find((p) => p.id === person.ownerId);
        return o ? `${o.firstName} ${o.lastName}`.trim() : null;
      })();

  const subtitle = isAnimal && ownerName ? `${PERSON_KIND_LABEL[person.kind]} Di ${ownerName}` : PERSON_KIND_LABEL[person.kind];

  // "Ho Fame" ha precedenza su "Sei Qui" quando capitano nello stesso istante, esattamente
  // come nei riquadri Casa/Fuori Casa di Home (vedi HouseholdAvatarCell) — evita che i due
  // badge finiscano sovrapposti nello stesso angolo dell'avatar.
  const showHungryBadge = isAnimal && isHungry(person);

  return (
    // Prima era un <button>: un <button> dentro l'altro (qui sotto, il badge "Ho Fame"
    // interattivo ne rende uno suo) non è HTML valido — lo stesso bug già corretto nella
    // card personale di Home (vedi PersonalCardMenu), qui non ancora capitato solo perché
    // "Ho Fame" non era mai stato reso interattivo in questa card. Un <div> col ruolo
    // giusto risolve senza perdere accessibilità né toccare le icone Chiama/WhatsApp.
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15"
    >
      <div className="relative shrink-0">
        <DialogueBubble person={person} />
        <AuraAvatar
          imageUrl={person.avatarUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          size={52}
          ring={ring}
          shape={isAnimal ? "squircle" : "circle"}
          layoutId={`person-avatar-${person.id}`}
          deceased={person.deceased}
        />
        {showHungryBadge ? (
          // Qui c'è davvero spazio sicuro (la card non ha overflow-hidden): a differenza
          // di Home, dove lo stesso badge resta solo indicativo, qui il tocco apre per
          // davvero il menu del cibo — la promessa del Checkpoint 8, che restava scritta
          // ma irraggiungibile: nessuna schermata la rendeva mai interattiva.
          <HungryBadge person={person} interactive />
        ) : (
          <PlaceIconBadge place={engagementPlace} size={52} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm text-ink-100">
          {person.firstName} {person.lastName}
        </p>
        <p className="truncate text-xs text-ink-800">
          {subtitle}
          {outings > 0 && ` · ${outings} Uscite`}
          {person.isDemo && (
            <span className="ml-1.5 rounded-full bg-[#B79A6B]/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#B79A6B]">
              Esempio
            </span>
          )}
        </p>
        <ActionLine person={person} />
      </div>
      {phone && (
        <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
          <a
            href={`tel:${phone}`}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:border-aura-cyan/50 hover:text-aura-cyan"
            aria-label={`Chiama ${person.firstName}`}
          >
            <Phone size={14} />
          </a>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:border-aura-emerald/50 hover:text-aura-emerald"
              aria-label={`Scrivi su WhatsApp a ${person.firstName}`}
            >
              <MessageCircle size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
