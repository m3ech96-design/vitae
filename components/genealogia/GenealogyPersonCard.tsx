"use client";
import { AuraAvatar } from "../ui/AuraAvatar";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { GenealogyPerson } from "@/lib/genealogy-types";
import { genealogyFullName, genealogyYearRange } from "@/lib/genealogy-format";
import { isEmptyAvatar } from "@/lib/unknown-relative";

/**
 * "[AVATAR] Nome Cognome / Grado di parentela / Anno di nascita – anno di morte" — esattamente
 * il formato del punto 8 delle istruzioni. `roleLabel` arriva già calcolato dal chiamante
 * (chi sta disegnando l'albero sa da quale relazione e quale direzione leggerlo — mai dedotto
 * qui dentro).
 */
export function GenealogyPersonCard({
  person,
  roleLabel,
  isReference,
  onTap,
  widthPx = 92,
}: {
  person: GenealogyPerson;
  roleLabel?: string;
  isReference: boolean;
  onTap: () => void;
  widthPx?: number;
}) {
  const avatarUrl = useResolvedImage(person.avatarKey);
  const years = genealogyYearRange(person);

  return (
    <button
      type="button"
      onClick={onTap}
      className="focus-ring flex flex-col items-center gap-1 rounded-xl2 p-1.5 text-center transition hover:bg-white/[0.04]"
      style={{ width: widthPx }}
    >
      <AuraAvatar
        imageUrl={avatarUrl}
        firstName={person.firstName}
        lastName={person.lastName}
        size={56}
        ring={isReference ? "home" : "idle"}
        deceased={!person.alive}
        empty={isEmptyAvatar(person)}
      />
      <span className="w-full truncate text-[11px] leading-tight text-ink-100">{genealogyFullName(person)}</span>
      <span className="w-full truncate text-[10px] leading-tight text-aura-cyan">
        {isReference ? "Persona di riferimento" : roleLabel}
      </span>
      {years && <span className="text-[10px] leading-tight text-ink-800">{years}</span>}
    </button>
  );
}
