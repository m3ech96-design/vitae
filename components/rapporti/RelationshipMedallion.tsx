"use client";
import { Crown, Flame, Heart } from "lucide-react";
import { Person, ANIMAL_KINDS } from "@/lib/types";
import { relationshipColor, relationshipLabel } from "@/lib/relationship";
import { AuraAvatar } from "../ui/AuraAvatar";

export function RelationshipMedallion({
  person,
  isPartner,
  onOpen,
  size = 72,
  showLabel = true,
}: {
  person: Person;
  isPartner: boolean;
  onOpen: () => void;
  /** Dimensione dell'avatar — di serie 72 (griglia), più piccola nella Costellazione quando
   * ci sono tante persone, per lasciare spazio senza farle toccare. */
  size?: number;
  /** Nella Costellazione, con molte persone, i nomi sotto ogni nodo affollerebbero la
   * scena — lì si disattiva, il nome resta comunque leggibile aprendo la persona. */
  showLabel?: boolean;
}) {
  const color = relationshipColor(person);
  const label = relationshipLabel(person);
  const intensity = Math.max(Math.abs(person.relationshipScore) / 100, person.trueFriendshipScore / 100, person.deepEnmityScore / 100);
  const scale = size / 72;
  const ringWidth = (2 + Math.round(intensity * 3)) * scale;
  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const radius = isAnimal ? 22 * scale : undefined;
  const badgeSize = Math.max(16, Math.round(24 * scale));
  const badgeIconSize = Math.max(9, Math.round(13 * scale));

  return (
    <button onClick={onOpen} className="focus-ring flex flex-col items-center gap-2">
      <div className="relative">
        <span
          className={isAnimal ? "absolute blur-md" : "absolute rounded-full blur-md"}
          style={{ inset: -6 * scale, background: color, opacity: 0.25 + intensity * 0.35, borderRadius: radius }}
        />
        <span
          className={isAnimal ? "relative flex items-center justify-center" : "relative flex items-center justify-center rounded-full"}
          style={{
            padding: ringWidth,
            background: `conic-gradient(${color}, ${color}55, ${color})`,
            boxShadow: `0 0 ${10 + intensity * 18}px ${color}99`,
            borderRadius: radius,
          }}
        >
          <AuraAvatar
            imageUrl={person.avatarUrl}
            firstName={person.firstName}
            lastName={person.lastName}
            size={size}
            ring="none"
            shape={isAnimal ? "squircle" : "circle"}
            deceased={person.deceased}
          />
        </span>
        {person.trueFriendshipScore >= 100 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-void-950 border border-[#FFD86B]/60"
            style={{ height: badgeSize, width: badgeSize }}
          >
            <Crown size={badgeIconSize} className="text-[#FFD86B]" />
          </span>
        )}
        {person.deepEnmityScore >= 100 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-void-950 border border-[#FF1F4B]/60"
            style={{ height: badgeSize, width: badgeSize }}
          >
            <Flame size={badgeIconSize} className="text-[#FF1F4B]" />
          </span>
        )}
        {isPartner && (
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-void-950 border border-aura-pink/60"
            style={{ height: badgeSize, width: badgeSize }}
          >
            <Heart size={badgeIconSize - 1} className="fill-aura-pink text-aura-pink" />
          </span>
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="max-w-[84px] truncate font-display text-xs text-ink-100">{person.firstName}</p>
          <p className="text-[10px]" style={{ color }}>
            {label}
          </p>
        </div>
      )}
    </button>
  );
}
