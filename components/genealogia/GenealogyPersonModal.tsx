"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, UserRound } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { GenealogyPerson } from "@/lib/genealogy-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { TextField, TextArea } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { Switch } from "../ui/Switch";
import { PartialDateFields } from "./PartialDateFields";

function PhotoPreview({ imageKey }: { imageKey: string }) {
  const url = useResolvedImage(imageKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

/** Crea o modifica una persona dell'Albero — non una Persona di lib/types.ts (il modulo Mondo/
 * Persone): questa è un'entità a parte, sua propria, coerente con la decisione di tenere il
 * grafo genealogico separato dal resto (vedi la nota in lib/genealogy-types.ts). */
export function GenealogyPersonModal({
  person,
  onSaved,
  onClose,
}: {
  person?: GenealogyPerson;
  /** Chiamato con l'id della persona appena creata o modificata — usato da chi apre questo
   * modale per collegarla subito con una relazione, se serve. */
  onSaved?: (personId: string) => void;
  onClose: () => void;
}) {
  const { addPerson, updatePerson } = useGenealogy();

  const [firstName, setFirstName] = useState(person?.firstName ?? "");
  const [lastName, setLastName] = useState(person?.lastName ?? "");
  const [avatarKey, setAvatarKey] = useState<string | undefined>(person?.avatarKey);
  const [alive, setAlive] = useState(person?.alive ?? true);
  const [birthDay, setBirthDay] = useState(person?.birthDay);
  const [birthMonth, setBirthMonth] = useState(person?.birthMonth);
  const [birthYear, setBirthYear] = useState(person?.birthYear);
  const [deathDay, setDeathDay] = useState(person?.deathDay);
  const [deathMonth, setDeathMonth] = useState(person?.deathMonth);
  const [deathYear, setDeathYear] = useState(person?.deathYear);
  const [notes, setNotes] = useState(person?.notes ?? "");

  const canSave = firstName.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatarKey,
      alive,
      birthDay,
      birthMonth,
      birthYear,
      deathDay: alive ? undefined : deathDay,
      deathMonth: alive ? undefined : deathMonth,
      deathYear: alive ? undefined : deathYear,
      notes: notes.trim() || undefined,
    };
    if (person) {
      updatePerson(person.id, payload);
      onSaved?.(person.id);
    } else {
      const created = addPerson(payload);
      onSaved?.(created.id);
    }
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
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
          <p className="font-display text-lg text-ink-100">{person ? "Modifica persona" : "Nuova persona"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <ImageCropInput
              shape="round"
              onChange={(key) => setAvatarKey(key)}
              trigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="focus-ring flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-white/15 text-ink-600 transition hover:border-aura-cyan/50"
                  aria-label="Foto della persona"
                >
                  {avatarKey ? <PhotoPreview imageKey={avatarKey} /> : <UserRound size={22} />}
                </button>
              )}
            />
            <div className="min-w-0 flex-1 space-y-3">
              <TextField label="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Es. Mario" />
              <TextField label="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Es. Rossi" />
            </div>
          </div>

          <PartialDateFields
            label="Data di nascita"
            day={birthDay}
            month={birthMonth}
            year={birthYear}
            onChange={(p) => {
              setBirthDay(p.day);
              setBirthMonth(p.month);
              setBirthYear(p.year);
            }}
          />

          <div className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-ink-100">{alive ? "In vita" : "Deceduto/a"}</span>
            <Switch checked={!alive} onChange={(v) => setAlive(!v)} />
          </div>

          {!alive && (
            <PartialDateFields
              label="Data di morte"
              day={deathDay}
              month={deathMonth}
              year={deathYear}
              onChange={(p) => {
                setDeathDay(p.day);
                setDeathMonth(p.month);
                setDeathYear(p.year);
              }}
            />
          )}

          <TextArea label="Note" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quello che vuoi ricordare..." />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {person ? "Salva modifiche" : "Crea persona"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
