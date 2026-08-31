"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, X, Users, Star, Search, Heart } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { useFeed } from "@/lib/feed-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { auraIntensity } from "@/lib/aura-intensity";
import { describeDiscoveries } from "@/lib/discovery-feed";
import { Person } from "@/lib/types";
import { toFamilyEntities } from "@/lib/family-entities";
import { connectedFamilyIds, relationshipInfo, isFemale, FamilyEntity, FamilyBranch } from "@/lib/family-relations";
import { computeReciprocalWrites, enrichParentPatch } from "@/lib/family-reciprocal";
import { isEmptyAvatar, emptyAvatarLabel } from "@/lib/unknown-relative";
import { lifespanLabel } from "@/lib/date-format";
import { useMood } from "@/lib/mood-context";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { FamilyRelationEditor } from "@/components/rapporti/FamilyRelationEditor";
import { FriendshipEditor } from "@/components/rapporti/FriendshipEditor";
import { personColor } from "@/lib/person-color";

/**
 * Due livelli, non uno: prima DI CHI è la famiglia (ramo — vedi FamilyBranch in
 * lib/family-relations.ts, calcolato lì, non indovinato qui da una stringa), poi CHE TIPO
 * di legame è, dentro quel ramo. Così i tuoi stessi genitori e fratelli non finiscono più
 * mescolati agli affini del coniuge, ed "Elimina l'ambiguità" resta vero anche con famiglie
 * allargate e centinaia di persone.
 */
const BRANCH_ORDER: { key: FamilyBranch; title: string }[] = [
  { key: "coniuge", title: "Coniuge E Partner" },
  { key: "provenienza", title: "Famiglia Di Provenienza" },
  { key: "discendenza", title: "Discendenza" },
  { key: "coniuge-famiglia", title: "Famiglia Del Coniuge" },
  { key: "lontano", title: "Parenti Alla Lontana" },
];

/** Dentro ogni ramo, il grado del legame — riconosciuto dal prefisso dell'etichetta perché
 * ora esistono varianti aperte (gradi di cugini, "alla lontana", nomi propri nei ponti più
 * lunghi) che un elenco chiuso non coprirebbe mai del tutto. L'ultima voce fa da rete: nulla
 * resta fuori in silenzio, nemmeno dentro il ramo giusto. */
const DEGREE_CATEGORIES: { title: string; test: (label: string) => boolean }[] = [
  { title: "Genitori", test: (l) => l === "Padre" || l === "Madre" },
  { title: "Figli", test: (l) => l === "Figlio" || l === "Figlia" || l === "Figlio/A" },
  { title: "Fratelli E Sorelle", test: (l) => /^(Fratello|Sorella)$/.test(l) },
  { title: "Nonni", test: (l) => /^(Bis)*Nonn/.test(l) },
  { title: "Nipoti", test: (l) => l.includes("Nipote") },
  { title: "Zii E Zie", test: (l) => /^(Prozi|Zi[oa])/.test(l) },
  { title: "Cugini", test: (l) => l.includes("Cugin") },
  { title: "Suoceri", test: (l) => /^Suocer/.test(l) },
  { title: "Cognati", test: (l) => /^Cognat/.test(l) },
  { title: "Generi E Nuore", test: (l) => /^(Gener|Nuora)/.test(l) },
  { title: "Patrigno E Matrigna", test: (l) => /^(Patrigno|Matrigna)/.test(l) },
  { title: "Figliastri", test: (l) => /^Figliastr/.test(l) },
  { title: "Altri Legami", test: () => true },
];

export default function FamilyTreePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { people, updatePerson, addPerson } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const intensityOf = (id: string) => {
    const p = people.find((x) => x.id === id);
    if (!p) return 1;
    const base = auraIntensity(p, tasks, places);
    // Un parente il cui legame è comunque fortissimo si accende un po' di più — l'unico
    // segno che resta di quel legame, dato che non ha più una seconda card tra gli Amici.
    return isBelovedRelative(p) ? Math.min(1, base * 1.3 + 0.15) : base;
  };
  const isBelovedRelative = (p: Person) => p.trueFriendshipScore > 0 || p.relationshipScore > 15;
  const { pushEvent } = useFeed();
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const entities = useMemo(() => toFamilyEntities(profile, people), [profile, people]);
  const byId = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const focus = byId.get(params.id);

  const relatedIds = useMemo(
    () => connectedFamilyIds(params.id, entities).filter((id) => id !== params.id),
    [entities, params.id]
  );

  // Chi è appena arrivato tra i parenti collegati: confronta con l'elenco del render
  // precedente e segna i nuovi id per un breve momento — l'albero cresce visibilmente
  // sotto le tue dita invece di limitarsi ad aggiornarsi.
  const prevRelatedRef = useRef<string[]>(relatedIds);
  const [arrivingIds, setArrivingIds] = useState<Set<string>>(new Set());
  const { fireTrigger } = useMood();
  useEffect(() => {
    const prev = new Set(prevRelatedRef.current);
    const added = relatedIds.filter((id) => !prev.has(id));
    prevRelatedRef.current = relatedIds;
    if (added.length === 0) return;
    setArrivingIds((cur) => new Set([...cur, ...added]));
    fireTrigger("famiglia:nuovo-legame");
    const timer = setTimeout(() => {
      setArrivingIds((cur) => {
        const next = new Set(cur);
        added.forEach((id) => next.delete(id));
        return next;
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [relatedIds]);

  const writeEntity = (id: string, patch: Partial<FamilyEntity>) => {
    if (id === "user") updateProfile(patch as never);
    else updatePerson(id, patch as never);
  };

  const updateFocus = (patch: Partial<FamilyEntity>) => {
    if (!focus) return;
    const enriched = "fatherId" in patch || "motherId" in patch ? enrichParentPatch(focus, patch, byId) : patch;
    writeEntity(focus.id, enriched);
    // Collega anche l'altro lato: coniuge/partner/ex coniugi sono simmetrici per
    // definizione, e i figli già registrati che aspettavano l'altro genitore lo ricevono ora.
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
    const added = newIds.filter((id) => !childIds.includes(id));
    const removed = childIds.filter((id) => !newIds.includes(id));

    added.forEach((id) => {
      const child = byId.get(id);
      if (!child) return;
      const enriched = enrichParentPatch(child, { [parentField]: focus.id }, byId);
      writeEntity(id, enriched);
    });
    removed.forEach((id) => {
      const child = byId.get(id);
      if (!child) return;
      const field = child.fatherId === focus.id ? "fatherId" : "motherId";
      writeEntity(id, { [field]: undefined });
    });
  };

  /** Crea un avatar vuoto — esiste a tutti gli effetti nell'albero (fratelli, nonni, tutto
   * si calcola comunque su di lui) e in tutte le altre funzioni (Scoperte, Impostazioni,
   * Impegni), come qualunque altra persona, ma senza nome: niente segnaposto testuale, la
   * semplice assenza di nome E cognome (vedi lib/unknown-relative.ts). Il giorno che scrivi
   * un nome vero (in Impostazioni, vedi PersonWindow), torna un avatar normale da solo, ed
   * è una Scoperta come le altre. */
  const createUnknownParent = (role: "father" | "mother") => {
    if (!focus) return;
    const newId = addPerson({
      firstName: "",
      lastName: "",
      kind: role === "father" ? "uomo" : "donna",
      livesAtHome: false,
    });
    updateFocus(role === "father" ? { fatherId: newId } : { motherId: newId });
  };

  if (!focus) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questa persona non esiste più.</p>
        <button onClick={() => router.push("/albero")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna all'albero
        </button>
      </div>
    );
  }

  const allMembers = relatedIds
    .map((id) => {
      const entity = byId.get(id);
      const info = relationshipInfo(params.id, id, byId);
      return entity && info ? { entity, label: info.label, branch: info.branch } : null;
    })
    .filter((m): m is { entity: FamilyEntity; label: string; branch: FamilyBranch } => Boolean(m));

  const searchQuery = search.trim().toLocaleLowerCase("it-IT");
  const visibleMembers = searchQuery
    ? allMembers.filter((m) => `${m.entity.firstName} ${m.entity.lastName}`.toLocaleLowerCase("it-IT").includes(searchQuery))
    : allMembers;

  // Primo livello: ramo. Secondo livello, dentro ogni ramo: grado del legame.
  const branches = BRANCH_ORDER.map(({ key, title }) => {
    const members = visibleMembers.filter((m) => m.branch === key);
    const byDegree = new Map<string, typeof members>();
    members.forEach((m) => {
      const deg = DEGREE_CATEGORIES.find((d) => d.test(m.label))!;
      if (!byDegree.has(deg.title)) byDegree.set(deg.title, []);
      byDegree.get(deg.title)!.push(m);
    });
    const degrees = DEGREE_CATEGORIES.map((d) => ({ title: d.title, members: byDegree.get(d.title) || [] })).filter(
      (d) => d.members.length > 0
    );
    return { title, count: members.length, degrees };
  }).filter((b) => b.count > 0);

  const isUser = params.id === "user";
  const focusPerson = people.find((p) => p.id === params.id);

  const updateFriendship = (patch: Partial<Pick<Person, "friendPersonIds" | "bestFriendPersonIds">>) => {
    if (!focusPerson) return;
    const descriptions = describeDiscoveries(focusPerson, patch, (id) => {
      if (id === "user") return `${profile.firstName} ${profile.lastName}`.trim();
      const p = people.find((x) => x.id === id);
      return p ? `${p.firstName} ${p.lastName}`.trim() : undefined;
    });
    updatePerson(focusPerson.id, patch);
    const fullName = `${focusPerson.firstName} ${focusPerson.lastName}`.trim();
    descriptions.forEach((d) => pushEvent(`Hai Scoperto Qualcosa Di Nuovo Su ${fullName}: ${d}`));
  };

  // Amici e Migliori Amici: per una persona sono quelli scelti qui, toccando il suo avatar;
  // per l'utente sono derivati da come vanno i Rapporti (Amicizia / Vera Amicizia). Chi è già
  // un parente (a qualunque grado, anche alla lontana — connectedFamilyIds non distingue)
  // non compare mai qui, per quanto vada forte il legame: sarebbe la stessa persona
  // duplicata in due sezioni, una delle quali con un titolo ("Non Parentela") falso nel suo
  // caso. Il legame resta comunque visibile — solo sulla riga che quella persona già ha
  // nell'Albero, con un anello più intenso invece che con una seconda card.
  const familyOfUser = useMemo(() => new Set(connectedFamilyIds("user", entities)), [entities]);
  const familyOfFocus = useMemo(
    () => (focusPerson ? new Set(connectedFamilyIds(focusPerson.id, entities)) : new Set<string>()),
    [entities, focusPerson]
  );
  const friendEntities = isUser
    ? people
        .filter((p) => p.relationshipScore > 15 && p.trueFriendshipScore <= 0 && !familyOfUser.has(p.id))
        .map((p) => byId.get(p.id))
        .filter((e): e is FamilyEntity => Boolean(e))
    : (focusPerson?.friendPersonIds || [])
        .filter((id) => !familyOfFocus.has(id))
        .map((id) => byId.get(id))
        .filter((e): e is FamilyEntity => Boolean(e));
  const bestFriendEntities = isUser
    ? people
        .filter((p) => p.trueFriendshipScore > 0 && !familyOfUser.has(p.id))
        .map((p) => byId.get(p.id))
        .filter((e): e is FamilyEntity => Boolean(e))
    : (focusPerson?.bestFriendPersonIds || [])
        .filter((id) => !familyOfFocus.has(id))
        .map((id) => byId.get(id))
        .filter((e): e is FamilyEntity => Boolean(e));
  /** Un parente il cui legame è comunque fortissimo — usato solo per intensificare
   * l'anello della sua riga nell'Albero (vedi intensityOf) e per un piccolo cuore, mai
   * per una seconda card tra gli Amici. */

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2rem)] sm:px-6">
      <button
        onClick={() => router.push("/albero")}
        className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={16} /> Rapporti
      </button>

      <div className="mt-6 flex flex-col items-center">
        <button onClick={() => setEditing(true)} className="focus-ring relative">
          <AuraAvatar
            imageUrl={focus.avatarUrl}
            firstName={focus.firstName}
            lastName={focus.lastName}
            size={92}
            ring="idle"
            glowColor={personColor(focus.id)}
            glowIntensity={intensityOf(focus.id)}
            deceased={focus.deceased}
            empty={isEmptyAvatar(focus)}
          />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-aura-amber/50 bg-void-950 text-aura-amber">
            <Pencil size={12} />
          </span>
        </button>
        <p className="mt-3 font-display text-xl text-ink-100">
          {params.id === "user" ? "Tu" : isEmptyAvatar(focus) ? emptyAvatarLabel(focus.kind ?? "") : `${focus.firstName} ${focus.lastName}`}
        </p>
        {focus.deceased && (
          <p className="text-xs text-ink-800">{lifespanLabel(focus.birthday, focus.deceasedYear)}</p>
        )}
        <p className="text-xs text-ink-600">Tocca l&apos;avatar per scegliere i suoi parenti</p>
      </div>

      {allMembers.length > 8 && (
        <div className="mt-6 flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
          <Search size={15} className="shrink-0 text-ink-800" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cerca tra ${allMembers.length} parenti…`}
            className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
          />
        </div>
      )}

      <div className="mt-9 space-y-10">
        {branches.length === 0 && friendEntities.length === 0 && bestFriendEntities.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-800">
            {searchQuery
              ? "Nessun parente trovato con questo nome."
              : "Nessun parente collegato ancora. Tocca l'avatar qui sopra per iniziare."}
          </p>
        )}
        {branches.map((b) => (
          <div key={b.title}>
            <p className="mb-4 font-display text-sm text-ink-100">
              {b.title} <span className="font-body text-xs text-ink-800">· {b.count}</span>
            </p>
            <div className="space-y-6">
              {b.degrees.map((g) => (
                <div key={g.title}>
                  <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">{g.title}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {g.members.map(({ entity, label }) => {
                      return (
                        <motion.button
                          key={entity.id}
                          layout
                          initial={arrivingIds.has(entity.id) ? { opacity: 0, y: 46, scale: 0.4 } : false}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={
                            arrivingIds.has(entity.id)
                              ? { type: "spring", stiffness: 260, damping: 20 }
                              : { type: "spring", stiffness: 300, damping: 30 }
                          }
                          onClick={() => router.push(`/albero/${entity.id}`)}
                          className="focus-ring flex flex-col items-center gap-1.5"
                        >
                          <span className="relative inline-flex">
                            <AuraAvatar
                              imageUrl={entity.avatarUrl}
                              firstName={entity.firstName}
                              lastName={entity.lastName}
                              size={64}
                              ring="idle"
                              glowColor={personColor(entity.id)}
                              glowIntensity={intensityOf(entity.id)}
                              deceased={entity.deceased}
                              empty={isEmptyAvatar(entity)}
                            />
                            {(() => {
                              const p = people.find((x) => x.id === entity.id);
                              return p && isBelovedRelative(p) ? (
                                <span
                                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-void-950 bg-aura-pink/90"
                                  title="Anche un legame fortissimo"
                                >
                                  <Heart size={10} fill="white" color="white" />
                                </span>
                              ) : null;
                            })()}
                          </span>
                          <p className="max-w-[80px] truncate text-center text-[11px] text-ink-200">
                            {entity.id === "user"
                              ? "Tu"
                              : isEmptyAvatar(entity)
                              ? emptyAvatarLabel(entity.kind ?? "")
                              : `${entity.firstName} ${entity.lastName}`}
                          </p>
                          <p className="text-[10px] text-aura-amber">{label}</p>
                          {entity.deceased && (
                            <p className="text-[9px] text-ink-800">{lifespanLabel(entity.birthday, entity.deceasedYear)}</p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!searchQuery && (friendEntities.length > 0 || bestFriendEntities.length > 0) && (
          <div className="border-t border-white/[0.08] pt-8">
            <p className="mb-1 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Amicizie — non parentela
            </p>
            <p className="mb-5 text-[11px] text-ink-800">
              {isUser
                ? "Derivate da come vanno i tuoi rapporti, non scelte a mano."
                : "Tocca l'avatar di questa persona qui sopra per sceglierle."}
            </p>

            {bestFriendEntities.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                  <Star size={12} className="text-aura-amber" /> Migliori amici
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {bestFriendEntities.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => router.push(`/albero/${e.id}`)}
                      className="focus-ring flex flex-col items-center gap-1.5"
                    >
                      <AuraAvatar imageUrl={e.avatarUrl} firstName={e.firstName} lastName={e.lastName} size={64} ring="idle" glowColor={personColor(e.id)} glowIntensity={intensityOf(e.id)} />
                      <p className="max-w-[80px] truncate text-center text-[11px] text-ink-200">
                        {e.id === "user" ? "Tu" : `${e.firstName} ${e.lastName}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {friendEntities.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                  <Users size={12} className="text-aura-cyan" /> Amici
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {friendEntities.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => router.push(`/albero/${e.id}`)}
                      className="focus-ring flex flex-col items-center gap-1.5"
                    >
                      <AuraAvatar imageUrl={e.avatarUrl} firstName={e.firstName} lastName={e.lastName} size={64} ring="idle" glowColor={personColor(e.id)} glowIntensity={intensityOf(e.id)} />
                      <p className="max-w-[80px] truncate text-center text-[11px] text-ink-200">
                        {e.id === "user" ? "Tu" : `${e.firstName} ${e.lastName}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
          <div className="glass-strong flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3">
            <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
              <p className="font-display text-lg text-ink-100">
                Legami Di {params.id === "user" ? "Te" : focus.firstName}
              </p>
              <button onClick={() => setEditing(false)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FamilyRelationEditor
                focus={focus}
                candidates={entities}
                childIds={childIds}
                onUpdate={updateFocus}
                onUpdateChildren={updateChildren}
                onCreateUnknownParent={createUnknownParent}
              />

              {!isUser && focusPerson && (
                <div className="mt-8 border-t border-white/[0.08] pt-6">
                  <p className="mb-1 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                    Amicizie — non parentela
                  </p>
                  <p className="mb-5 text-[11px] text-ink-800">
                    Non contano come grado di parentela, ma si scelgono allo stesso modo.
                  </p>
                  <FriendshipEditor person={focusPerson} candidates={people} onUpdate={updateFriendship} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
