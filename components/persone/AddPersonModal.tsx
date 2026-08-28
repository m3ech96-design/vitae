"use client";
import { useState } from "react";
import { X, User, Baby, Dog, Cat, Skull } from "lucide-react";
import { motion } from "framer-motion";
import { PersonKind, PERSON_KIND_LABEL, ANIMAL_KINDS } from "@/lib/types";
import { capitalizeWords } from "@/lib/text";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { AvatarUploader } from "../wizard/AvatarUploader";
import { TextField } from "../ui/TextField";
import { PersonPicker } from "../ui/PersonPicker";
import { Button } from "../ui/Button";
import { DeceasedDateFields } from "./DeceasedDateFields";

const KIND_OPTIONS: { kind: PersonKind; icon: React.ReactNode }[] = [
  { kind: "uomo", icon: <User size={16} /> },
  { kind: "donna", icon: <User size={16} /> },
  { kind: "bambino", icon: <Baby size={16} /> },
  { kind: "bambina", icon: <Baby size={16} /> },
  { kind: "cane", icon: <Dog size={16} /> },
  { kind: "gatto", icon: <Cat size={16} /> },
];

export function AddPersonModal({
  onClose,
  title = "Aggiungi Persona",
  lockLivesAtHome,
  forceAnimal,
}: {
  onClose: () => void;
  title?: string;
  lockLivesAtHome?: boolean;
  forceAnimal?: boolean;
}) {
  const { people, addPerson } = useHousehold();
  const { profile } = useProfile();
  const [kind, setKind] = useState<PersonKind>(forceAnimal ? "cane" : "uomo");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [livesAtHome, setLivesAtHome] = useState(Boolean(lockLivesAtHome));
  const [ownerId, setOwnerId] = useState<string>("user");
  const [deceased, setDeceased] = useState(false);
  const [deceasedDay, setDeceasedDay] = useState<number | undefined>(undefined);
  const [deceasedMonth, setDeceasedMonth] = useState<number | undefined>(undefined);
  const [deceasedYear, setDeceasedYear] = useState<number | undefined>(undefined);
  // Solo qui, solo alla creazione: se conosci già questa persona/animale e avete già una
  // storia, non deve per forza partire da zero — mai più modificabile a mano dopo questo
  // momento, da qui in poi cambia solo interagendo davvero (vedi Rapporti).
  const [initialRelationship, setInitialRelationship] = useState(0);

  const kindOptions = forceAnimal ? KIND_OPTIONS.filter((o) => o.kind === "cane" || o.kind === "gatto") : KIND_OPTIONS;
  const isAnimalKind = ANIMAL_KINDS.includes(kind);

  const submit = () => {
    if (!firstName.trim()) return;
    const deceasedPatch = deceased
      ? { deceased, deceasedDay, deceasedMonth, deceasedYear }
      : { deceased };
    if (isAnimalKind) {
      const owner = people.find((p) => p.id === ownerId);
      const ownerLivesAtHome = ownerId === "user" || Boolean(owner?.livesAtHome);
      addPerson({
        firstName: capitalizeWords(firstName.trim()),
        lastName: capitalizeWords(lastName.trim()),
        avatarUrl,
        kind,
        livesAtHome: ownerLivesAtHome,
        ownerId,
        ...deceasedPatch,
        relationshipScore: initialRelationship,
      });
    } else {
      addPerson({
        firstName: capitalizeWords(firstName.trim()),
        lastName: capitalizeWords(lastName.trim()),
        avatarUrl,
        kind,
        livesAtHome: lockLivesAtHome ?? livesAtHome,
        ...deceasedPatch,
        relationshipScore: initialRelationship,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{title}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {kindOptions.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => setKind(opt.kind)}
              className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all ${
                kind === opt.kind
                  ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100 shadow-glow-sm"
                  : "border-white/10 text-ink-600 hover:border-white/25 hover:text-ink-200"
              }`}
            >
              {opt.icon} {PERSON_KIND_LABEL[opt.kind]}
            </button>
          ))}
        </div>

        <div className="mb-5 flex justify-center">
          <AvatarUploader
            imageUrl={avatarUrl}
            firstName={firstName}
            lastName={lastName}
            onChange={setAvatarUrl}
          />
        </div>

        <div className="space-y-3">
          <TextField label="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          <TextField label="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        {isAnimalKind ? (
          <div className="mt-4">
            <PersonPicker
              label="Chi È Il Padrone?"
              value={ownerId}
              allowNone={false}
              options={[
                { id: "user", firstName: profile.firstName ? `Io (${profile.firstName})` : "Io", lastName: "" },
                ...people.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, avatarUrl: p.avatarUrl })),
              ]}
              onChange={(id) => setOwnerId(id || "user")}
            />
          </div>
        ) : (
          !lockLivesAtHome && (
            <button
              type="button"
              onClick={() => setLivesAtHome((v) => !v)}
              className={`focus-ring mt-4 flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                livesAtHome ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              Vive Con Te
              <span className={`h-5 w-9 rounded-full transition-colors ${livesAtHome ? "bg-aura-violet" : "bg-white/10"}`}>
                <span
                  className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                    livesAtHome ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => setDeceased((v) => !v)}
          className={`focus-ring mt-3 flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
            deceased ? "border-ink-600/60 bg-white/[0.04] text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <span className="flex items-center gap-2">
            <Skull size={14} className={deceased ? "text-ink-400" : "text-ink-800"} />
            {kind === "donna" || kind === "bambina" ? "Defunta" : "Defunto"}
          </span>
          <span className={`h-5 w-9 rounded-full transition-colors ${deceased ? "bg-ink-600" : "bg-white/10"}`}>
            <span
              className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                deceased ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        {deceased && (
          <DeceasedDateFields
            day={deceasedDay}
            month={deceasedMonth}
            year={deceasedYear}
            onChange={(patch) => {
              if ("deceasedDay" in patch) setDeceasedDay(patch.deceasedDay);
              if ("deceasedMonth" in patch) setDeceasedMonth(patch.deceasedMonth);
              if ("deceasedYear" in patch) setDeceasedYear(patch.deceasedYear);
            }}
          />
        )}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Il Vostro Rapporto, Ad Oggi
            </span>
            <span className={`text-xs ${initialRelationship > 0 ? "text-aura-cyan" : initialRelationship < 0 ? "text-aura-pink" : "text-ink-800"}`}>
              {initialRelationship > 0 ? `+${initialRelationship}` : initialRelationship}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={initialRelationship}
            onChange={(e) => setInitialRelationship(Number(e.target.value))}
            className="w-full accent-aura-violet"
          />
          <p className="mt-1 text-[10px] text-ink-800">
            Solo Se La Conosci Già — Da Qui In Poi Cambia Solo Interagendo Davvero, Mai Più A
            Mano.
          </p>
        </div>

        <Button className="mt-6 w-full justify-center" onClick={submit} disabled={!firstName.trim()}>
          {title}
        </Button>
        </div>
      </motion.div>
    </div>
  );
}
