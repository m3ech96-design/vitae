"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2, GitBranch, X as XIcon } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { GenealogyRelationship } from "@/lib/genealogy-types";
import { genealogyFullName, genealogyYearRange } from "@/lib/genealogy-format";
import { isEmptyAvatar } from "@/lib/unknown-relative";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { AuraAvatar } from "../ui/AuraAvatar";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { GenealogyPersonModal } from "./GenealogyPersonModal";
import { GenealogyRelationshipModal } from "./GenealogyRelationshipModal";

function ownRoleInRelationship(personId: string, rel: GenealogyRelationship) {
  return rel.personXId === personId
    ? { otherId: rel.personYId, roleTypeId: rel.typeIdForX }
    : { otherId: rel.personXId, roleTypeId: rel.typeIdForY };
}

/**
 * La scheda che si apre toccando una persona nell'albero — raccoglie qui le azioni del punto
 * 13 delle istruzioni: profilo/modifica in testa, poi la lista delle relazioni (ciascuna con
 * modifica/rimozione propria — MAI la stessa azione che elimina la persona), "aggiungi
 * relazione", "apri il suo albero" (solo se non è già la persona di riferimento), ed elimina
 * persona in fondo, ben separata.
 */
export function GenealogyPersonSheet({
  personId,
  isReference,
  onClose,
  onOpenTree,
}: {
  personId: string;
  isReference: boolean;
  onClose: () => void;
  onOpenTree: (personId: string) => void;
}) {
  const { people, relationships, allTypes, removePerson, removeRelationship } = useGenealogy();
  const person = people.find((p) => p.id === personId);
  const typesById = new Map(allTypes.map((t) => [t.id, t]));

  const [editingPerson, setEditingPerson] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<GenealogyRelationship | null>(null);
  const [confirmDeletePerson, setConfirmDeletePerson] = useState(false);
  const [confirmDeleteRelId, setConfirmDeleteRelId] = useState<string | null>(null);

  const avatarUrl = useResolvedImage(person?.avatarKey);
  const myRelationships = relationships.filter((r) => r.personXId === personId || r.personYId === personId);

  if (!person) return null;
  const years = genealogyYearRange(person);

  return (
    <>
      <PersonalCardSheet
        title={
          <div className="flex items-center gap-2">
            <span>{genealogyFullName(person)}</span>
            <button onClick={() => setEditingPerson(true)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Modifica persona">
              <Pencil size={14} />
            </button>
          </div>
        }
        onClose={onClose}
      >
        <div className="flex flex-col items-center gap-2 pb-2">
          <AuraAvatar
            imageUrl={avatarUrl}
            firstName={person.firstName}
            lastName={person.lastName}
            size={80}
            ring={isReference ? "home" : "idle"}
            deceased={!person.alive}
            empty={isEmptyAvatar(person)}
          />
          <p className="text-sm text-ink-600">
            {isReference ? "Persona di riferimento" : years || "Nessuna data registrata"}
            {isReference && years ? ` · ${years}` : ""}
          </p>
          {person.notes && <p className="mt-1 max-w-xs text-center text-sm text-ink-300">{person.notes}</p>}
        </div>

        {!isReference && (
          <Button variant="outline" className="mt-2 w-full justify-center" onClick={() => onOpenTree(person.id)}>
            <GitBranch size={14} /> Apri il suo albero
          </Button>
        )}

        <div className="mt-6 space-y-2">
          <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">Relazioni</p>
          {myRelationships.length === 0 && <p className="text-xs text-ink-800">Nessuna relazione registrata ancora.</p>}
          {myRelationships.map((rel) => {
            const { otherId, roleTypeId } = ownRoleInRelationship(person.id, rel);
            const other = people.find((p) => p.id === otherId);
            if (!other) return null;
            return (
              <div key={rel.id} className="flex items-center justify-between gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-ink-200">
                  {typesById.get(roleTypeId)?.label ?? "—"} di {genealogyFullName(other)}
                </span>
                <button onClick={() => setEditingRelationship(rel)} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label="Modifica relazione">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setConfirmDeleteRelId(rel.id)} className="focus-ring shrink-0 text-ink-600 hover:text-aura-pink" aria-label="Rimuovi relazione">
                  <XIcon size={13} />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => setAddingRelationship(true)}
            className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 transition hover:border-aura-cyan/50 hover:text-ink-200"
          >
            <Plus size={13} /> Aggiungi relazione
          </button>
        </div>

        <Button variant="danger" className="mt-6 w-full justify-center" onClick={() => setConfirmDeletePerson(true)}>
          <Trash2 size={14} /> Elimina persona
        </Button>
      </PersonalCardSheet>

      {editingPerson && <GenealogyPersonModal person={person} onClose={() => setEditingPerson(false)} />}
      {addingRelationship && <GenealogyRelationshipModal anchorPersonId={person.id} onClose={() => setAddingRelationship(false)} />}
      {editingRelationship && (
        <GenealogyRelationshipModal
          anchorPersonId={person.id}
          existingRelationship={editingRelationship}
          onClose={() => setEditingRelationship(null)}
        />
      )}
      {confirmDeleteRelId && (
        <ConfirmDialog
          title="Rimuovere questa relazione?"
          description="La persona collegata resta comunque nell'Albero — solo il legame viene tolto."
          onConfirm={() => {
            removeRelationship(confirmDeleteRelId);
            setConfirmDeleteRelId(null);
          }}
          onCancel={() => setConfirmDeleteRelId(null)}
        />
      )}
      {confirmDeletePerson && (
        <ConfirmDialog
          title={`Eliminare ${genealogyFullName(person)}?`}
          description="Ogni relazione che la coinvolge verrà rimossa. L'azione non si può annullare."
          onConfirm={() => {
            removePerson(person.id);
            setConfirmDeletePerson(false);
            onClose();
          }}
          onCancel={() => setConfirmDeletePerson(false)}
        />
      )}
    </>
  );
}
