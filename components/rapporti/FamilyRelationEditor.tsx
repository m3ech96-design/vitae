"use client";
import { FamilyEntity } from "@/lib/family-relations";
import { PersonPicker } from "../ui/PersonPicker";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";

/**
 * Solo i legami diretti si scelgono qui — Padre, Madre, Coniuge, Ex Coniugi, Partner, e i
 * Figli (che in realtà scrivono sul record del figlio, non su questo: vedi onUpdateChildren).
 * Tutto il resto — fratelli, nonni, zii, cugini, cognati, suoceri, parentele alla lontana di
 * qualunque grado — non si sceglie più da nessuna parte: si calcola da solo da questi pochi
 * legami (vedi lib/family-relations.ts), quindi non può più andare fuori sincrono né
 * diventare un muro di pulsanti ingestibile con famiglie allargate.
 */
export function FamilyRelationEditor({
  focus,
  candidates,
  childIds,
  onUpdate,
  onUpdateChildren,
  onCreateUnknownParent,
}: {
  focus: FamilyEntity;
  candidates: FamilyEntity[];
  childIds: string[];
  onUpdate: (patch: Partial<FamilyEntity>) => void;
  onUpdateChildren: (newChildIds: string[]) => void;
  /** Crea un genitore segnaposto ("Padre Sconosciuto"/"Madre Sconosciuta") e lo collega
   * subito — vedi PersonPicker. */
  onCreateUnknownParent: (role: "father" | "mother") => void;
}) {
  const options = candidates.filter((c) => c.id !== focus.id);

  return (
    <div className="space-y-6">
      <PersonPicker
        label="Partner"
        value={focus.partnerPersonId}
        options={options}
        onChange={(id) => onUpdate({ partnerPersonId: id })}
      />
      <PersonPicker
        label="Coniuge (marito / moglie)"
        value={focus.spouseId}
        options={options}
        onChange={(id) => onUpdate({ spouseId: id })}
      />
      <MultiPersonPicker
        label="Ex coniugi"
        values={focus.exSpouseIds}
        options={options}
        onChange={(ids) => onUpdate({ exSpouseIds: ids })}
      />
      <PersonPicker
        label="Padre"
        value={focus.fatherId}
        options={options}
        onChange={(id) => onUpdate({ fatherId: id })}
        unknownOption={
          focus.fatherId ? undefined : { label: "Esiste, Ma Non So Chi È", onCreate: () => onCreateUnknownParent("father") }
        }
      />
      <PersonPicker
        label="Madre"
        value={focus.motherId}
        options={options}
        onChange={(id) => onUpdate({ motherId: id })}
        unknownOption={
          focus.motherId ? undefined : { label: "Esiste, Ma Non So Chi È", onCreate: () => onCreateUnknownParent("mother") }
        }
      />
      <div>
        <MultiPersonPicker label="Figli" values={childIds} options={options} onChange={onUpdateChildren} />
        <p className="mt-1.5 text-[10px] text-ink-800">
          Se il genitore che aggiungi qui ha già un coniuge o partner, diventa figlio di
          entrambi in automatico.
        </p>
      </div>
    </div>
  );
}
