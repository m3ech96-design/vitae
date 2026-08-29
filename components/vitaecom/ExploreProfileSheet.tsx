"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, Heart, GitBranch, Search, ArrowUpRight } from "lucide-react";
import { Person, ANIMAL_KINDS } from "@/lib/types";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { capArray } from "@/lib/cap-array";
import { applyInteraction } from "@/lib/relationship";
import {
  POSITIVE_INTERACTIONS,
  NEGATIVE_INTERACTIONS,
  ANIMAL_POSITIVE_INTERACTIONS,
  ANIMAL_NEGATIVE_INTERACTIONS,
} from "@/lib/interactions";
import { toFamilyEntities } from "@/lib/family-entities";
import { relationshipInfo, isFemale, FamilyEntity, RelationshipInfo } from "@/lib/family-relations";
import { enrichParentPatch, computeReciprocalWrites } from "@/lib/family-reciprocal";
import { allDiscoverySections } from "@/lib/vitaecom-discoveries";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { RelationshipGauge } from "@/components/rapporti/RelationshipGauge";
import { RelationshipChart } from "@/components/rapporti/RelationshipChart";
import { InteractionPicker } from "@/components/rapporti/InteractionPicker";
import { FamilyRelationEditor } from "@/components/rapporti/FamilyRelationEditor";
import { PersonWindow } from "@/components/persone/PersonWindow";
import { LinkAccountPanel } from "./LinkAccountPanel";

type Tab = "scoperte" | "rapporto" | "albero";

function ScoperteTab({ person }: { person: Person }) {
  const sections = allDiscoverySections(person);
  return (
    <div className="space-y-7">
      {sections.length === 0 && (
        <p className="text-sm text-ink-800">Non Hai Ancora Scoperto Nulla Su Di {isFemale(person) ? "Lei" : "Lui"}.</p>
      )}
      {sections.map((s) => (
        <div key={s.title}>
          <p className="mb-2.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">{s.title}</p>
          <div className="space-y-1.5">
            {s.lines.map((l, i) => (
              <div
                key={`${l.label}-${i}`}
                className="flex items-start justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="text-xs text-ink-600">{l.label}</span>
                <span className="text-right text-xs text-ink-200">{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RapportoTab({ person, adding, onDonePicking }: { person: Person; adding: boolean; onDonePicking: () => void }) {
  const { updatePerson } = useHousehold();
  const { profile } = useProfile();
  const { fireTrigger } = useMood();
  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const isPartner = profile.partnerPersonId === person.id;
  const recent = [...person.relationshipHistory].reverse().slice(0, 3);

  const handlePick = (label: string, positive: boolean) => {
    const { patch, event } = applyInteraction(person, label, positive, isPartner);
    updatePerson(person.id, { ...patch, relationshipHistory: capArray([...person.relationshipHistory, event], 300) });
    fireTrigger(isAnimal ? (positive ? "animali:interazione-positiva" : "animali:interazione-negativa") : positive ? "rapporti:positiva" : "rapporti:negativa");
    onDonePicking();
  };

  return (
    <div className="space-y-7">
      <RelationshipGauge person={person} />

      {recent.length > 0 && (
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Ultime Interazioni</p>
          <div className="space-y-1.5">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                <span className="text-xs text-ink-300">{e.label}</span>
                <span className={`shrink-0 font-display text-xs ${e.delta >= 0 ? "text-aura-cyan" : "text-aura-pink"}`}>
                  {e.delta >= 0 ? "+" : ""}
                  {e.delta.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RelationshipChart events={person.relationshipHistory} />

      {adding && (
        <div>
          <p className="mb-3 font-display text-sm text-ink-100">Nuova Interazione</p>
          <InteractionPicker
            positiveOptions={isAnimal ? ANIMAL_POSITIVE_INTERACTIONS : POSITIVE_INTERACTIONS}
            negativeOptions={isAnimal ? ANIMAL_NEGATIVE_INTERACTIONS : NEGATIVE_INTERACTIONS}
            onPick={handlePick}
          />
        </div>
      )}
    </div>
  );
}

function AlberoTab({ person, adding }: { person: Person; adding: boolean }) {
  const router = useRouter();
  const { people, addPerson, updatePerson } = useHousehold();
  const { profile, updateProfile } = useProfile();
  const { linkAccountToPerson } = useVitaecomSocial();
  const [nickQuery, setNickQuery] = useState("");

  const entities = useMemo(() => toFamilyEntities(profile, people), [profile, people]);
  const byId = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const focus = byId.get(person.id);

  const directRelatives = useMemo(() => {
    if (!focus) return [] as { entity: FamilyEntity; info: RelationshipInfo }[];
    return entities
      .filter((e) => e.id !== focus.id)
      .map((e) => ({ entity: e, info: relationshipInfo(focus.id, e.id, byId) }))
      .filter((x): x is { entity: FamilyEntity; info: RelationshipInfo } => Boolean(x.info));
  }, [entities, byId, focus]);

  const writeEntity = (id: string, patch: Partial<FamilyEntity>) => {
    if (id === "user") updateProfile(patch as never);
    else updatePerson(id, patch as never);
  };

  const updateFocus = (patch: Partial<FamilyEntity>) => {
    if (!focus) return;
    const enriched = "fatherId" in patch || "motherId" in patch ? enrichParentPatch(focus, patch, byId) : patch;
    writeEntity(focus.id, enriched);
    const reciprocal = computeReciprocalWrites(focus, enriched, byId, entities);
    reciprocal.forEach((w) => writeEntity(w.id, w.patch));
  };

  const childIds = useMemo(
    () => (focus ? entities.filter((e) => e.fatherId === focus.id || e.motherId === focus.id).map((e) => e.id) : []),
    [entities, focus]
  );

  const updateChildren = (newIds: string[]) => {
    if (!focus) return;
    const parentField = isFemale(focus) ? "motherId" : "fatherId";
    newIds
      .filter((id) => !childIds.includes(id))
      .forEach((id) => {
        const child = byId.get(id);
        if (child) writeEntity(id, enrichParentPatch(child, { [parentField]: focus.id }, byId));
      });
    childIds
      .filter((id) => !newIds.includes(id))
      .forEach((id) => {
        const child = byId.get(id);
        if (!child) return;
        const field = child.fatherId === focus.id ? "fatherId" : "motherId";
        writeEntity(id, { [field]: undefined });
      });
  };

  const createUnknownParent = (role: "father" | "mother") => {
    if (!focus) return;
    const newId = addPerson({ firstName: "", lastName: "", kind: role === "father" ? "uomo" : "donna", livesAtHome: false });
    updateFocus(role === "father" ? { fatherId: newId } : { motherId: newId });
  };

  const nickMatches = nickQuery.trim()
    ? DEMO_ACCOUNTS.filter((a) => a.nickname.toLocaleLowerCase("it-IT").includes(nickQuery.trim().toLocaleLowerCase("it-IT")))
    : [];

  const addFromNickname = (accountId: string, nickname: string) => {
    const newId = addPerson({ firstName: nickname, lastName: "", kind: "uomo", livesAtHome: false });
    linkAccountToPerson(accountId, newId);
    setNickQuery("");
  };

  if (!focus) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push(`/rapporti/albero/${person.id}`)}
        className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 px-4 py-3 text-sm text-ink-200 hover:border-aura-violet/40"
      >
        Apri Albero Genealogico Completo
        <ArrowUpRight size={15} className="text-ink-600" />
      </button>

      {directRelatives.length === 0 && !adding && (
        <p className="text-sm text-ink-800">Non Hai Ancora Scoperto Nessun Legame Di Famiglia.</p>
      )}

      {directRelatives.length > 0 && (
        <div className="space-y-1.5">
          {directRelatives.map(({ entity, info }) => (
            <div key={entity.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
              <AuraAvatar imageUrl={entity.avatarUrl} firstName={entity.firstName} lastName={entity.lastName} size={30} ring="idle" />
              <span className="flex-1 truncate text-xs text-ink-200">
                {entity.firstName} {entity.lastName}
              </span>
              <span className="shrink-0 text-[11px] text-ink-800">{info.label}</span>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="space-y-5">
          <div>
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Cerca Un Nickname Da Aggiungere
            </span>
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-800" />
              <input
                value={nickQuery}
                onChange={(e) => setNickQuery(e.target.value)}
                placeholder="Cerca Per Nickname…"
                className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-8 pr-3 text-xs text-ink-100 placeholder:text-ink-800"
              />
            </div>
            {nickMatches.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {nickMatches.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => addFromNickname(a.id, a.nickname)}
                    className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 px-3.5 py-2.5 text-left text-xs text-ink-200 hover:border-[#B79A6B]/50"
                  >
                    @{a.nickname}
                    <Plus size={13} className="text-ink-600" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[10px] text-ink-800">
              Crea Una Nuova Persona Collegata A Quell&apos;Account — Poi Sceglila Qui Sotto Come Ruolo.
            </p>
          </div>
          <FamilyRelationEditor
            focus={focus}
            candidates={entities}
            childIds={childIds}
            onUpdate={updateFocus}
            onUpdateChildren={updateChildren}
            onCreateUnknownParent={createUnknownParent}
          />
        </div>
      )}
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: typeof Sparkles }[] = [
  { key: "scoperte", label: "Scoperte", icon: Sparkles },
  { key: "rapporto", label: "Rapporto", icon: Heart },
  { key: "albero", label: "Albero", icon: GitBranch },
];

export function ExploreProfileSheet({
  accountId,
  nickname,
  onClose,
}: {
  accountId: string;
  nickname: string;
  onClose: () => void;
}) {
  const { people } = useHousehold();
  const { accountLinks } = useVitaecomSocial();
  const [tab, setTab] = useState<Tab>("scoperte");
  const [editingPerson, setEditingPerson] = useState(false);
  const [addingRapporto, setAddingRapporto] = useState(false);
  const [addingAlbero, setAddingAlbero] = useState(false);
  const linkedId = accountLinks[accountId];
  const person = linkedId ? people.find((p) => p.id === linkedId) : undefined;

  // Un solo "+" in alto a sinistra per tutt'e tre le schede, come richiesto — cambia solo
  // cosa apre a seconda della scheda attiva, invece di un pulsante diverso ripetuto tre
  // volte dentro ciascun corpo scheda.
  const handlePlus = () => {
    if (tab === "scoperte") setEditingPerson(true);
    else if (tab === "rapporto") setAddingRapporto((v) => !v);
    else setAddingAlbero((v) => !v);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="glass-strong flex max-h-[88vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
        >
          <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
            {person ? (
              <button onClick={handlePlus} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Aggiungi">
                <Plus size={18} />
              </button>
            ) : (
              <span />
            )}
            <p className="font-display text-sm text-ink-100">Esplora @{nickname}</p>
            <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
              <X size={18} />
            </button>
          </div>

          <div className="shrink-0 relative z-10 mt-4 flex gap-1.5 px-6">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
                  tab === key ? "border-[#B79A6B]/60 bg-[#B79A6B]/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!person ? (
              <LinkAccountPanel accountId={accountId} nickname={nickname} />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab === "scoperte" && <ScoperteTab person={person} />}
                  {tab === "rapporto" && (
                    <RapportoTab person={person} adding={addingRapporto} onDonePicking={() => setAddingRapporto(false)} />
                  )}
                  {tab === "albero" && <AlberoTab person={person} adding={addingAlbero} />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {editingPerson && person && <PersonWindow person={person} onClose={() => setEditingPerson(false)} />}
    </>
  );
}
