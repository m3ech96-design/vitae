"use client";
import { Person } from "@/lib/types";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";

type FriendField = "friendPersonIds" | "bestFriendPersonIds";

/**
 * Amici e Migliori Amici di una Persona (non dell'utente: i suoi sono derivati dai Rapporti,
 * vedi il testo informativo nella pagina che usa questo componente). Non fanno parte della
 * parentela vera e propria — per questo vivono qui, accanto al resto dei legami di questa
 * persona, invece che tra le Scoperte. Con la ricerca invece del muro di pulsanti: anche qui
 * le persone possono essere centinaia.
 */
export function FriendshipEditor({
  person,
  candidates,
  onUpdate,
}: {
  person: Person;
  candidates: Person[];
  onUpdate: (patch: Partial<Pick<Person, FriendField>>) => void;
}) {
  const options = candidates.filter((c) => c.id !== person.id);

  if (options.length === 0) {
    return (
      <p className="text-xs text-ink-800">
        Amici si scelgono tra le persone che crei — torna qui una volta che ne avrai aggiunta
        almeno una, dalla scheda Mondo.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <MultiPersonPicker
        label="Amici"
        values={person.friendPersonIds}
        options={options}
        onChange={(friendPersonIds) => onUpdate({ friendPersonIds })}
      />
      <MultiPersonPicker
        label="Migliori amici"
        values={person.bestFriendPersonIds}
        options={options}
        onChange={(bestFriendPersonIds) => onUpdate({ bestFriendPersonIds })}
      />
    </div>
  );
}
