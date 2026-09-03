"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Search, Plus, UserRound, CircleHelp } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { GenealogyRelationship } from "@/lib/genealogy-types";
import { genealogyFullName } from "@/lib/genealogy-format";
import { isEmptyAvatar } from "@/lib/unknown-relative";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { AuraAvatar } from "../ui/AuraAvatar";
import { Button } from "../ui/Button";
import { GenealogyPersonModal } from "./GenealogyPersonModal";

function PersonRow({ personId, onPick }: { personId: string; onPick: () => void }) {
  const { people } = useGenealogy();
  const person = people.find((p) => p.id === personId);
  const avatarUrl = useResolvedImage(person?.avatarKey);
  if (!person) return null;
  return (
    <button
      type="button"
      onClick={onPick}
      className="focus-ring flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
    >
      <AuraAvatar imageUrl={avatarUrl} firstName={person.firstName} lastName={person.lastName} size={34} ring="idle" empty={isEmptyAvatar(person)} />
      <span className="truncate text-sm text-ink-100">{genealogyFullName(person)}</span>
    </button>
  );
}

/**
 * Aggiunge una relazione tra `anchorPersonId` e un'altra persona — esistente o nuova. I due
 * tipi (come l'altra persona è vista dall'ancora, e viceversa) sono due selettori del tutto
 * indipendenti: nessuno dei due propone o pre-compila l'altro. Scelta esplicita dell'utente,
 * confermata dopo problemi avuti in passato con versioni automatiche — vedi la nota in
 * lib/genealogy-types.ts.
 */
export function GenealogyRelationshipModal({
  anchorPersonId,
  existingRelationship,
  onClose,
}: {
  anchorPersonId: string;
  /** Se presente, si sta modificando una relazione già esistente invece di crearne una nuova
   * — l'altra persona resta fissa, cambiano solo i due tipi. */
  existingRelationship?: GenealogyRelationship;
  onClose: () => void;
}) {
  const { people, visibleTypes, addPerson, addRelationship, updateRelationship } = useGenealogy();
  const anchor = people.find((p) => p.id === anchorPersonId);

  const initialOtherId = existingRelationship
    ? existingRelationship.personXId === anchorPersonId
      ? existingRelationship.personYId
      : existingRelationship.personXId
    : null;

  const [otherPersonId, setOtherPersonId] = useState<string | null>(initialOtherId);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [query, setQuery] = useState("");
  const [typeForOther, setTypeForOther] = useState(
    existingRelationship
      ? existingRelationship.personXId === anchorPersonId
        ? existingRelationship.typeIdForY
        : existingRelationship.typeIdForX
      : ""
  );
  const [typeForAnchor, setTypeForAnchor] = useState(
    existingRelationship
      ? existingRelationship.personXId === anchorPersonId
        ? existingRelationship.typeIdForX
        : existingRelationship.typeIdForY
      : ""
  );

  const otherPerson = people.find((p) => p.id === otherPersonId);

  const candidates = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it-IT");
    return people
      .filter((p) => p.id !== anchorPersonId)
      .filter((p) => !q || genealogyFullName(p).toLocaleLowerCase("it-IT").includes(q));
  }, [people, anchorPersonId, query]);

  const canSave = Boolean(otherPersonId && typeForOther && typeForAnchor);

  /**
   * "Sconosciuto": crea al volo una persona senza nome — esiste a tutti gli effetti e si
   * posiziona nell'albero secondo la gerarchia scelta qui sotto, ma il suo avatar resta un
   * contorno tratteggiato con un "?" (vedi GenealogyPersonCard.tsx e lib/unknown-relative.ts,
   * lo stesso meccanismo già in uso per le Persone) finché qualcuno non le dà un nome
   * modificandola in un secondo momento — nessuno stato separato da sincronizzare, torna un
   * avatar normale da solo appena nome o cognome smettono di essere vuoti.
   */
  const addUnknownPerson = () => {
    const created = addPerson({ firstName: "", lastName: "", alive: true });
    setOtherPersonId(created.id);
  };

  const submit = () => {
    if (!canSave || !otherPersonId) return;
    if (existingRelationship) {
      const patch =
        existingRelationship.personXId === anchorPersonId
          ? { typeIdForY: typeForOther, typeIdForX: typeForAnchor }
          : { typeIdForX: typeForOther, typeIdForY: typeForAnchor };
      updateRelationship(existingRelationship.id, patch);
    } else {
      addRelationship({ personXId: anchorPersonId, personYId: otherPersonId, typeIdForY: typeForOther, typeIdForX: typeForAnchor });
    }
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !anchor) return null;

  if (mode === "create") {
    return (
      <GenealogyPersonModal
        onSaved={(id) => {
          setOtherPersonId(id);
          setMode("pick");
        }}
        onClose={() => setMode("pick")}
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">
            {existingRelationship ? "Modifica relazione" : "Nuova relazione"}
          </p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {!otherPersonId ? (
            <div>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                Con chi è la relazione
              </p>
              <div className="mb-3 flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                <Search size={15} className="shrink-0 text-ink-800" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca una persona già inserita..."
                  className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setMode("create")}
                className="focus-ring mb-2 flex w-full items-center gap-2.5 rounded-xl2 border border-dashed border-white/15 px-3.5 py-2.5 text-sm text-aura-cyan hover:border-aura-cyan/50"
              >
                <Plus size={15} /> Crea una nuova persona
              </button>
              <button
                type="button"
                onClick={addUnknownPerson}
                className="focus-ring mb-3 flex w-full items-center gap-2.5 rounded-xl2 border border-dashed border-white/15 px-3.5 py-2.5 text-sm text-ink-300 hover:border-white/30"
              >
                <CircleHelp size={15} /> Aggiungi sconosciuto
              </button>
              <p className="mb-2 text-[11px] text-ink-800">
                Usalo quando sai che questo grado di parentela esiste ma non conosci ancora chi sia — resta senza nome finché non lo modifichi.
              </p>
              <div className="max-h-60 overflow-y-auto">
                {candidates.length === 0 && <p className="py-3 text-center text-xs text-ink-800">Nessuna persona trovata.</p>}
                {candidates.map((p) => (
                  <PersonRow key={p.id} personId={p.id} onPick={() => setOtherPersonId(p.id)} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                <UserRound size={15} className="text-aura-cyan" />
                <span className="truncate text-sm text-ink-100">{otherPerson ? genealogyFullName(otherPerson) : ""}</span>
                {!existingRelationship && (
                  <button
                    onClick={() => setOtherPersonId(null)}
                    className="focus-ring ml-auto shrink-0 text-[11px] text-ink-600 hover:text-ink-200"
                  >
                    Cambia
                  </button>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                  {otherPerson ? genealogyFullName(otherPerson) : "L'altra persona"} è ___ di {genealogyFullName(anchor)}
                </span>
                <select
                  value={typeForOther}
                  onChange={(e) => setTypeForOther(e.target.value)}
                  className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
                >
                  <option value="" className="bg-void-800">Scegli...</option>
                  {visibleTypes.map((t) => (
                    <option key={t.id} value={t.id} className="bg-void-800">{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                  {genealogyFullName(anchor)} è ___ di {otherPerson ? genealogyFullName(otherPerson) : "quella persona"}
                </span>
                <select
                  value={typeForAnchor}
                  onChange={(e) => setTypeForAnchor(e.target.value)}
                  className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
                >
                  <option value="" className="bg-void-800">Scegli...</option>
                  {visibleTypes.map((t) => (
                    <option key={t.id} value={t.id} className="bg-void-800">{t.label}</option>
                  ))}
                </select>
                <span className="mt-1.5 block text-[11px] text-ink-800">
                  Scritto a mano indipendentemente dal campo sopra — nessuno dei due viene proposto in base all&apos;altro.
                </span>
              </label>
            </>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {existingRelationship ? "Salva modifiche" : "Aggiungi relazione"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
