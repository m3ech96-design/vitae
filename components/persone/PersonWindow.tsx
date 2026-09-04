"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Phone, MessageCircle, MessageSquare, CalendarClock, Trash2, Sparkles, Check, PawPrint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Person, PERSON_KIND_LABEL, ANIMAL_KINDS, kindForGenderChange } from "@/lib/types";
import { describeDiscoveries } from "@/lib/discovery-feed";
import { diffPatch } from "@/lib/diff-patch";
import { useHousehold } from "@/lib/household-context";
import { useFeed } from "@/lib/feed-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useProfile } from "@/lib/profile-context";
import { currentEngagement } from "@/lib/presence";
import { personWorldStatus } from "@/lib/task-presence";
import { commonGround } from "@/lib/common-ground";
import { discoveryProvenance } from "@/lib/discovery-provenance";
import { capitalizeWords } from "@/lib/text";
import { isEmptyAvatar, emptyAvatarLabel } from "@/lib/unknown-relative";
import { useMood } from "@/lib/mood-context";
import { lifespanLabel } from "@/lib/date-format";
import { AuraAvatar } from "../ui/AuraAvatar";
import { AvatarUploader } from "../wizard/AvatarUploader";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { SwitchVisual } from "../ui/Switch";
import { IdentityCoreFields } from "../wizard/sections/IdentityCoreFields";
import { EducationWorkSection } from "../wizard/sections/EducationWorkSection";
import { CorpoSection } from "../wizard/sections/CorpoSection";
import { InterestsSection } from "../wizard/sections/InterestsSection";
import { CustomSectionView } from "../wizard/sections/CustomSectionView";
import { CreateSectionControl } from "../wizard/CreateSectionControl";
import { AnimalCareSection } from "../animali/AnimalCareSection";
import { EngagementEditor } from "./EngagementEditor";
import { PhraseEditor } from "./PhraseEditor";
import { ActionEditor } from "./ActionEditor";
import { CommonGroundSection } from "./CommonGroundSection";
import { DeceasedDateFields } from "./DeceasedDateFields";

type Tab = "scoperte" | "impostazioni" | "impegni";

export function PersonWindow({ person, onClose }: { person: Person; onClose: () => void }) {
  const router = useRouter();
  const { people, home, updatePerson, removePerson } = useHousehold();
  const { profile } = useProfile();
  const { pushEvent } = useFeed();
  const { fireTrigger } = useMood();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const [tab, setTab] = useState<Tab>("scoperte");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Person>(person);
  const [justSaved, setJustSaved] = useState(false);
  const [justSavedKeys, setJustSavedKeys] = useState<string[]>([]);

  // La bozza riparte da capo solo quando apri una persona diversa, non a ogni rientrata
  // del componente — altrimenti perderesti quello che stai scrivendo.
  useEffect(() => {
    setDraft(person);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.id]);

  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const phone = person.phone;
  const waLink = phone ? `https://wa.me/${phone.replace(/[^\d+]/g, "")}` : null;
  const engagement = currentEngagement(person);
  const engagementPlaceId = engagement?.linkedPlaceId ? places.find((p) => p.id === engagement.linkedPlaceId)?.id ?? null : null;
  const status = personWorldStatus(person, tasks, home?.placeId, engagementPlaceId);
  const statusLabel = status === "casa" ? "In casa" : status === "fuori-casa" ? "Fuori casa" : "Nel Mondo";
  const ring = status === "casa" ? "home" : status === "fuori-casa" ? "away" : "world";
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();
  const displayName = isEmptyAvatar(draft) ? emptyAvatarLabel(person.kind) : fullName;
  const commonGroups = isAnimal ? [] : commonGround(profile, draft);
  const hasUnsavedChanges = Object.keys(diffPatch(person, draft)).length > 0;
  // Calcolato da `draft` (mai da `person`), quindi cambia all'istante appena il Sesso viene
  // toccato nel menu qui sotto — non deve aspettare che "Salva" scriva il dato e che il
  // genitore ripropaghi un `person` fresco: quel giro può bastare a far percepire "il sesso
  // resta fermo al valore precedente" anche quando il dato sotto è già cambiato.
  const liveKind = kindForGenderChange(draft.kind, draft.gender);

  /**
   * Ogni campo delle Scoperte scrive qui, non nel dato reale — così scrivere una frase non
   * genera una Novità per ogni lettera digitata. Solo "Salva" (o chiudere, che salva
   * comunque per non perdere nulla) confronta la bozza con l'originale e genera UNA sola
   * notifica per ogni campo davvero cambiato, con la provenienza calcolata in quel momento —
   * non ad ogni tasto premuto.
   */
  const updateDraft = (patch: Partial<Person>) => setDraft((d) => ({ ...d, ...patch }));

  const commitDraft = () => {
    const patch = diffPatch(person, draft);
    if (Object.keys(patch).length === 0) return;
    // Vedi la nota su `kindForGenderChange`: se il Sesso è appena cambiato, allinea anche
    // "kind" nella stessa scrittura, altrimenti resterebbe indietro rispetto a "gender".
    if ("gender" in patch) {
      const newKind = kindForGenderChange(person.kind, patch.gender);
      if (newKind !== person.kind) patch.kind = newKind;
    }
    const descriptions = describeDiscoveries(person, patch, (id) => {
      const p = people.find((x) => x.id === id);
      return p ? `${p.firstName} ${p.lastName}`.trim() : undefined;
    });
    updatePerson(person.id, patch);
    if (descriptions.length > 0) {
      const provenance = discoveryProvenance(person.id, tasks, places);
      descriptions.forEach((d) =>
        pushEvent(`Hai scoperto qualcosa di nuovo su ${displayName}: ${d}${provenance ? ` — ${provenance}` : ""}`)
      );
      fireTrigger("scoperte:salvate");
    }
    // I campi appena salvati si schiariscono come inchiostro che si asciuga — restano
    // "appena salvati" un filo più a lungo dell'animazione stessa (1.1s), così anche
    // l'ultimo a partire fa in tempo a vedersi fino in fondo.
    setJustSavedKeys(Object.keys(patch));
    setTimeout(() => setJustSavedKeys([]), 1400);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const handleClose = () => {
    commitDraft();
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
          <span />
          <button onClick={handleClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 relative z-10 flex flex-col items-center px-6">
          <AuraAvatar
            imageUrl={person.avatarUrl}
            firstName={draft.firstName}
            lastName={draft.lastName}
            size={92}
            ring={ring}
            shape={isAnimal ? "squircle" : "circle"}
            layoutId={`person-avatar-${person.id}`}
            deceased={person.deceased}
            empty={isEmptyAvatar(draft)}
          />
          <p className="mt-3 font-display text-xl text-ink-100">
            {displayName}
          </p>
          <span className="mt-1 rounded-full border border-white/10 px-3 py-1 text-xs text-ink-600">
            {PERSON_KIND_LABEL[liveKind]} &middot; {statusLabel}
          </span>
          {person.deceased && (
            <p className="mt-1.5 text-xs text-ink-800">{lifespanLabel(person.birthday, person.deceasedYear)}</p>
          )}
          {(phone || person.vitaecomAccountId) && (
            <div className="mt-3 flex gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-cyan/50 hover:text-aura-cyan">
                  <Phone size={15} />
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-emerald/50 hover:text-aura-emerald">
                  <MessageCircle size={15} />
                </a>
              )}
              {/* Solo per una Persona nata dal ponte Vitaecom↔Mondo (vedi
                 `vitaecomAccountId`): la sua conversazione vera vive lì, non un link
                 esterno come WhatsApp — stessa chat raggiungibile anche da KnowPanel sul
                 suo profilo Vitaecom. */}
              {person.vitaecomAccountId && (
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/vitaecom/chat/${person.vitaecomAccountId}`);
                  }}
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-[#B79A6B]/50 hover:text-[#B79A6B]"
                  aria-label={`Apri la chat Vitaecom con ${displayName}`}
                >
                  <MessageSquare size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 relative z-10 mt-5 flex gap-1.5 overflow-x-auto no-scrollbar px-6">
          <button
            onClick={() => setTab("scoperte")}
            className={`focus-ring flex items-center gap-1.5 shrink-0 rounded-full border px-3.5 py-2 text-xs transition ${tab === "scoperte" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"}`}
          >
            <Sparkles size={13} /> Scoperte
          </button>
          <button
            onClick={() => setTab("impostazioni")}
            className={`focus-ring shrink-0 rounded-full border px-3.5 py-2 text-xs transition ${tab === "impostazioni" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"}`}
          >
            Impostazioni
          </button>
          <button
            onClick={() => setTab("impegni")}
            className={`focus-ring flex items-center gap-1.5 shrink-0 rounded-full border px-3.5 py-2 text-xs transition ${tab === "impegni" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"}`}
          >
            <CalendarClock size={13} /> Impegni
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "scoperte" && (
              <motion.div
                key="scoperte"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-9"
              >
              <div>
                <p className="mb-4 font-display text-sm text-ink-100">Identità</p>
                <IdentityCoreFields
                  data={draft}
                  onUpdate={updateDraft}
                  isAnimal={isAnimal}
                  justSavedKeys={justSavedKeys}
                  nameFields={
                    isEmptyAvatar(draft)
                      ? {
                          firstName: draft.firstName,
                          lastName: draft.lastName,
                          onChange: (patch) => {
                            // Un solo evento di Scoperta, esattamente al passaggio da vuoto a
                            // non-vuoto — `wasEmpty` è vero solo alla primissima lettera
                            // digitata, perché subito dopo `draft` smette di essere vuoto.
                            const wasEmpty = isEmptyAvatar(draft);
                            updateDraft(patch);
                            updatePerson(person.id, patch);
                            if (wasEmpty) {
                              const nextFirst = patch.firstName ?? draft.firstName;
                              const nextLast = patch.lastName ?? draft.lastName;
                              if (nextFirst.trim() || nextLast.trim()) {
                                pushEvent(`Hai scoperto chi è: ora è ${nextFirst} ${nextLast}`.trim());
                                fireTrigger("scoperte:nome-parente");
                              }
                            }
                          },
                        }
                      : undefined
                  }
                />
              </div>

              <CommonGroundSection groups={commonGroups} />

              {isAnimal ? (
                <div>
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/animali/${person.id}`);
                    }}
                    className="focus-ring mb-5 flex w-full items-center justify-between rounded-xl2 border border-aura-violet/30 bg-aura-violet/[0.06] px-4 py-3 text-left transition hover:bg-aura-violet/[0.1]"
                  >
                    <span className="flex items-center gap-2 text-sm text-ink-100">
                      <PawPrint size={15} className="text-aura-violet" /> Scheda completa in Animali
                    </span>
                    <span className="text-[11px] text-ink-600">Salute, peso, vaccinazioni…</span>
                  </button>
                  <p className="mb-4 font-display text-sm text-ink-100">Cura dell&apos;animale</p>
                  <AnimalCareSection person={draft} onUpdate={updateDraft} />
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-4 font-display text-sm text-ink-100">Istruzione e lavoro</p>
                    <EducationWorkSection data={draft} onUpdate={updateDraft} linkedPersonId={person.id} justSavedKeys={justSavedKeys} />
                  </div>
                  <div>
                    <p className="mb-4 font-display text-sm text-ink-100">Corpo</p>
                    <CorpoSection data={draft} onUpdate={updateDraft} justSavedKeys={justSavedKeys} />
                  </div>
                  <div>
                    <p className="mb-4 font-display text-sm text-ink-100">Interessi</p>
                    <InterestsSection data={draft} onUpdate={updateDraft} />
                  </div>
                </>
              )}

              {draft.customSections.map((section) => (
                <CustomSectionView
                  key={section.id}
                  section={section}
                  onUpdate={(patch) =>
                    updateDraft({
                      customSections: draft.customSections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)),
                    })
                  }
                />
              ))}
              <CreateSectionControl
                onCreate={(title) =>
                  updateDraft({
                    customSections: [...draft.customSections, { id: Math.random().toString(36).slice(2, 9), title, fields: [] }],
                  })
                }
              />
              </motion.div>
            )}

            {tab === "impegni" && (
              <motion.div
                key="impegni"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <EngagementEditor
                  personId={person.id}
                  engagements={person.engagements}
                  onChange={(engagements) => updatePerson(person.id, { engagements })}
                />
              </motion.div>
            )}

            {tab === "impostazioni" && (
              <motion.div
                key="impostazioni"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-9"
              >
              <div>
                <p className="mb-4 font-display text-sm text-ink-100">Dati base</p>
                <div className="mb-4 flex justify-center">
                  <AvatarUploader
                    imageUrl={person.avatarUrl}
                    firstName={person.firstName}
                    lastName={person.lastName}
                    onChange={(avatarUrl) => updatePerson(person.id, { avatarUrl })}
                  />
                </div>
                {!isEmptyAvatar(draft) && (
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Nome"
                      value={draft.firstName}
                      onChange={(e) => {
                        const value = capitalizeWords(e.target.value);
                        updateDraft({ firstName: value });
                        updatePerson(person.id, { firstName: value });
                      }}
                    />
                    <TextField
                      label="Cognome"
                      value={draft.lastName}
                      onChange={(e) => {
                        const value = capitalizeWords(e.target.value);
                        updateDraft({ lastName: value });
                        updatePerson(person.id, { lastName: value });
                      }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => updatePerson(person.id, { deceased: !person.deceased })}
                  className={`focus-ring mt-3 flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                    person.deceased ? "border-ink-600/60 bg-white/[0.04] text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  {liveKind === "donna" || liveKind === "bambina" ? "Defunta" : "Defunto"}
                  <SwitchVisual checked={Boolean(person.deceased)} tone="ink" />
                </button>
                {person.deceased && (
                  <DeceasedDateFields
                    day={person.deceasedDay}
                    month={person.deceasedMonth}
                    year={person.deceasedYear}
                    onChange={(patch) => updatePerson(person.id, patch)}
                  />
                )}
              </div>

              <div className="border-t border-white/[0.06] pt-5">
                <button
                  onClick={() => updatePerson(person.id, { dialogModeEnabled: !person.dialogModeEnabled })}
                  className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                    person.dialogModeEnabled ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  Modalità dialogo
                  <SwitchVisual checked={Boolean(person.dialogModeEnabled)} />
                </button>
                <p className="mb-3 mt-2 text-xs text-ink-800">
                  Frasi ricorrenti che compaiono a caso vicino all&apos;avatar di {person.firstName}.
                </p>
                <PhraseEditor
                  phrases={person.recurringPhrases}
                  onChange={(recurringPhrases) => updatePerson(person.id, { recurringPhrases })}
                />
              </div>

              <div className="border-t border-white/[0.06] pt-5">
                <button
                  onClick={() => updatePerson(person.id, { liveModeEnabled: !person.liveModeEnabled })}
                  className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                    person.liveModeEnabled ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  Modalità vivo
                  <SwitchVisual checked={Boolean(person.liveModeEnabled)} />
                </button>
                <p className="mb-3 mt-2 text-xs text-ink-800">
                  Cosa {person.firstName} sta facendo, in certi orari o a caso. Compare nella card, non nella nuvoletta.
                </p>
                <ActionEditor
                  action={person.actionPhrase}
                  onChange={(actionPhrase) => updatePerson(person.id, { actionPhrase })}
                />
              </div>

              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={13} /> Elimina persona
              </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {tab === "scoperte" && (
          <div className="shrink-0 border-t border-white/[0.06] px-6 py-4">
            <Button className="w-full justify-center" onClick={commitDraft} disabled={!hasUnsavedChanges && !justSaved}>
              {justSaved ? (
                <>
                  <Check size={14} /> Salvato
                </>
              ) : (
                "Salva"
              )}
            </Button>
            {!hasUnsavedChanges && !justSaved && (
              <p className="mt-1.5 text-center text-[10px] text-ink-800">
                Nessuna modifica da salvare — le novità arrivano tutte insieme quando salvi.
              </p>
            )}
          </div>
        )}
      </motion.div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Eliminare ${displayName}?`}
          description="Scoperte, rapporti e cronologia andranno persi per sempre."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removePerson(person.id);
            onClose();
          }}
        />
      )}
    </div>
,
    document.body
  );
}
