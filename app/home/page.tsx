"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Wallet, Sparkles, Pencil, Users, Dumbbell, LocateFixed } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { useFeed } from "@/lib/feed-context";
import { computeAge } from "@/lib/text";
import { Person } from "@/lib/types";
import { personWorldStatus, userTaskDrivenLocation } from "@/lib/task-presence";
import { currentEngagement } from "@/lib/presence";
import { isAsleep } from "@/lib/time";
import { usePlaces } from "@/lib/places-context";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PlaceIconBadge } from "@/components/ui/PlaceIconBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LinkHomeCard } from "@/components/household/LinkHomeCard";
import { AddToHouseholdMenu } from "@/components/household/AddToHouseholdMenu";
import { VitaecomHouseholdAvatarCell } from "@/components/household/VitaecomHouseholdAvatarCell";
import { vitaecomMemberIsHome } from "@/lib/vitaecom-household-presence";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { PersonWindow } from "@/components/persone/PersonWindow";
import { HouseholdAvatarCell } from "@/components/household/HouseholdAvatarCell";
import { HouseholdMessagesFeed } from "@/components/home/HouseholdMessagesFeed";
import { HouseholdMessageBar } from "@/components/home/HouseholdMessageBar";
import { HomeWidgetsGrid } from "@/components/widgets/HomeWidgetsGrid";
import { AddWidgetSheet } from "@/components/widgets/AddWidgetSheet";
import { TaskCountdownLog } from "@/components/home/TaskCountdownLog";
import { TodaySummaryCard } from "@/components/home/TodaySummaryCard";
import { RapportNudgeCard } from "@/components/home/RapportNudgeCard";
import { WeeklyNeedsCard } from "@/components/home/WeeklyNeedsCard";
import { VitaecomNotificationsCard } from "@/components/home/VitaecomNotificationsCard";
import { PersonalCardMenu } from "@/components/home/PersonalCardMenu";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { moodBackgroundLayers, moodBackgroundOpacity } from "@/lib/mood-tone";

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return "Buongiorno";
  if (hour >= 12 && hour < 18) return "Buon pomeriggio";
  if (hour >= 18 && hour < 22) return "Buonasera";
  return "Buonanotte";
}

const SHORTCUTS = [
  { href: "/salute", icon: HeartPulse, label: "Salute", desc: "Referti, appuntamenti, farmaci" },
  { href: "/attivita-peso", icon: Dumbbell, label: "Attività e peso", desc: "Allenamenti e pesate" },
  { href: "/finanze", icon: Wallet, label: "Finanze", desc: "Budget e risparmi" },
  { href: "/rapporti", icon: Sparkles, label: "Rapporti", desc: "Legami e animali" },
];

export default function HomePage() {
  const { profile, hydrated: profileHydrated, updateProfile } = useProfile();
  const { activeMood, activeMoodIntensity, allMoods } = useMood();
  const mood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : null;
  const normalMood = allMoods.find((m) => m.id === "normale");
  const displayMood = mood ?? normalMood ?? null;
  const displayIntensity = mood ? activeMoodIntensity : 0.4;
  const {
    hydrated: householdHydrated,
    people,
    home,
    trackingEnabled,
    setTrackingEnabled,
    userIsAway,
    trackingError,
    trackingPermissionDenied,
    currentPlaceIcon,
  } = useHousehold();
  const [greeting, setGreeting] = useState("Ciao");
  const [openPerson, setOpenPerson] = useState<Person | null>(null);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const { events: feedEvents, clearEvents } = useFeed();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { householdMembers } = useVitaecomSocial();
  const [, setTick] = useState(0);

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!profileHydrated || !householdHydrated) return null;
  const age = computeAge(profile.birthday);

  const statusOf = (p: Person) => {
    const eng = currentEngagement(p);
    const engPlaceId = eng?.linkedPlaceId ? places.find((pl) => pl.id === eng.linkedPlaceId)?.id ?? null : null;
    return personWorldStatus(p, tasks, home?.placeId, engPlaceId);
  };
  // Chi vive con te (livesAtHome) risulta sempre "casa" o "fuori-casa", mai "mondo" (vedi
  // lib/task-presence.ts) — la Famiglia mostra solo loro, non l'intero elenco Persone.
  const familyStatusOf = (p: Person) => statusOf(p) as "casa" | "fuori-casa";
  const userTaskLocation = userTaskDrivenLocation(tasks, home?.placeId);
  // La geolocalizzazione, quando è attiva e ha una lettura vera, ha sempre l'ultima parola
  // sul "sei a casa": un Impegno/Evento che ti vorrebbe fuori casa non può più contraddire
  // il GPS che ti vede fisicamente lì (il caso segnalato: "ho un evento fuori casa ma sono
  // ancora in casa secondo il GPS, eppure risulto fuori"). Il luogo dedotto dalla task resta
  // valido per tutto il resto — nessuna lettura GPS attendibile (rilevamento spento), o il
  // GPS stesso conferma che sei altrove.
  const gpsConfirmsHome = trackingEnabled && !userIsAway;
  const userIsHome = gpsConfirmsHome ? true : userTaskLocation ? userTaskLocation === "casa" : !userIsAway;
  const userAsleep = isAsleep(profile.wakeUntil);
  // Il Place "Casa" vero dell'utente, per l'icona badge quando si è dentro casa (vedi anche
  // HouseholdAvatarCell, stessa logica per ogni componente della famiglia).
  const homePlace = home ? places.find((p) => p.id === home.placeId) ?? null : null;
  // La posizione di un account Vitaecom nel riquadro Famiglia è simulata (vedi
  // lib/vitaecom-household-presence.ts) — ricalcolata a ogni minuto insieme al resto della
  // Home (lo stesso `tick` già usato per far scorrere le altre presenze). Non più divisa in
  // due elenchi Casa/Fuori Casa: il riquadro Famiglia mostra tutti i componenti insieme,
  // ognuno con la propria icona di stato (meccanica già esistente, invariata).
  const vitaecomFamilyAccounts = DEMO_ACCOUNTS.filter((a) => householdMembers.includes(a.id));

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <Reveal>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Home</p>
        <h1 className="mt-1 font-display text-2xl text-ink-100">
          {greeting}, {profile.firstName || "Ospite"}
        </h1>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard
          glow={displayMood ? "none" : "violet"}
          className="relative mt-6 flex items-center gap-4 p-5 transition-shadow duration-1000"
          style={
            displayMood
              ? { boxShadow: `0 0 ${28 * displayIntensity}px -4px ${displayMood.color}88, 0 0 70px -20px ${displayMood.color}55` }
              : undefined
          }
        >
          {displayMood && (
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
              style={{
                background: moodBackgroundLayers(displayMood, displayIntensity).join(", "),
                opacity: moodBackgroundOpacity(displayMood) * displayIntensity,
              }}
              aria-hidden
            />
          )}
          {/* Il click sull'intera card non apre più nulla: apriva un "Resoconto" doppione
             di ciò che i widget già mostrano (vedi HomeWidgetsGrid) — rimosso su richiesta.
             Un semplice <div> basta: senza un click proprio, non c'è più bisogno del ruolo
             da bottone né del vincolo "niente bottone dentro bottone" che imponeva. */}
          <div className="relative flex min-w-0 flex-1 items-center gap-4 text-left">
            <span
              role={userAsleep ? "button" : undefined}
              tabIndex={userAsleep ? 0 : undefined}
              onClick={() => {
                if (!userAsleep) return;
                updateProfile({ wakeUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
              }}
              className={`relative inline-flex shrink-0 ${userAsleep ? "opacity-70" : ""}`}
            >
              <AuraAvatar
                imageUrl={profile.avatarUrl}
                firstName={profile.firstName}
                lastName={profile.lastName}
                size={72}
                ring={userAsleep ? "sleep" : "home"}
              />
              {!userAsleep &&
                (userIsHome ? (
                  <PlaceIconBadge place={homePlace} size={72} />
                ) : (
                  <PlaceIconBadge place={currentPlaceIcon} size={72} showWorldFallback />
                ))}
              <PersonalCardMenu />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-ink-100">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-ink-600">{age !== null ? `${age} anni` : "Età non impostata"}</p>
              {displayMood && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: displayMood.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: displayMood.color }} />
                  {displayMood.label}
                </p>
              )}
            </div>
          </div>
          <div className="relative flex flex-col items-end gap-2">
            <Link href="/profilo">
              <Button variant="outline" size="sm">
                <Pencil size={14} /> Profilo
              </Button>
            </Link>
          </div>
        </GlassCard>
      </Reveal>

      <HouseholdMessagesFeed />

      {!home ? (
        <Reveal delay={0.1} className="mt-6">
          <LinkHomeCard />
        </Reveal>
      ) : (
        <Reveal delay={0.1} className="mt-6">
          <GlassCard glow="violet" className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-aura-violet" />
                <p className="font-display text-sm text-ink-100">Famiglia</p>
              </div>
              {/* Corretto secondo le istruzioni: spostato qui dal menu Bisogni/Stati
                 d'animo — un interruttore diretto, più vicino a cosa controlla davvero
                 (chi in questo riquadro risulta a casa o fuori). */}
              <button
                onClick={() => setTrackingEnabled(!trackingEnabled)}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition hover:border-aura-cyan/50"
                aria-label={`Rilevamento posizione: ${trackingEnabled ? "attivo" : "spento"}`}
                title={`Rilevamento posizione: ${trackingEnabled ? "attivo" : "spento"}`}
              >
                <LocateFixed size={14} className={trackingEnabled ? "text-aura-cyan" : "text-ink-800"} />
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Corretto secondo le istruzioni: di notte anche l'utente principale risulta
                 dormiente, come già ogni altro componente della famiglia (vedi
                 HouseholdAvatarCell) — toccando l'avatar ci si sveglia per un'ora, stesso
                 gesto già in uso per tutti gli altri. */}
              <div
                role={userAsleep ? "button" : undefined}
                tabIndex={userAsleep ? 0 : undefined}
                onClick={() => {
                  if (!userAsleep) return;
                  updateProfile({ wakeUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`relative inline-flex ${userAsleep ? "opacity-70" : ""}`}>
                  <AuraAvatar
                    imageUrl={profile.avatarUrl}
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    size={60}
                    ring={userAsleep ? "sleep" : "home"}
                  />
                  {!userAsleep &&
                    (userIsHome ? (
                      <PlaceIconBadge place={homePlace} size={60} />
                    ) : (
                      <PlaceIconBadge place={currentPlaceIcon} size={60} showWorldFallback />
                    ))}
                </span>
                <span className="max-w-[64px] truncate text-[11px] text-ink-600">Tu</span>
              </div>
              {people
                .filter((p) => p.livesAtHome)
                .map((p) => (
                  <HouseholdAvatarCell key={p.id} person={p} location={familyStatusOf(p)} onOpen={setOpenPerson} />
                ))}
              {vitaecomFamilyAccounts.map((a) => (
                <VitaecomHouseholdAvatarCell
                  key={a.id}
                  account={a}
                  location={vitaecomMemberIsHome(a.id) ? "casa" : "fuori-casa"}
                />
              ))}
              <AddToHouseholdMenu />
            </div>
            {trackingError && (
              <p className={`mt-3 text-[11px] ${trackingPermissionDenied ? "text-aura-pink" : "text-ink-800"}`}>
                {trackingError}
              </p>
            )}
          </GlassCard>
        </Reveal>
      )}

      {home && (
        <Reveal delay={0.12} className="mt-3">
          <HouseholdMessageBar />
        </Reveal>
      )}

      <Reveal delay={0.15} className="mt-9 space-y-6">
        <TodaySummaryCard />
        <TaskCountdownLog />
        <RapportNudgeCard />
        <WeeklyNeedsCard />
        <VitaecomNotificationsCard />
      </Reveal>

      <Reveal delay={0.18} className="mt-9">
        <HomeWidgetsGrid onAddWidget={() => setAddWidgetOpen(true)} />
      </Reveal>

      <Reveal delay={0.2}>
        <p className="mb-3 mt-9 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Scorciatoie
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <GlassCard className="p-3.5 transition hover:border-white/20">
                <Icon size={17} className="text-aura-cyan" />
                <p className="mt-2.5 font-display text-xs text-ink-100">{label}</p>
                <p className="mt-0.5 text-[10px] text-ink-800">{desc}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </Reveal>

      {feedEvents.length > 0 && (
        <Reveal delay={0.25} className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Novità
            </p>
            <button
              onClick={clearEvents}
              className="focus-ring text-[11px] text-ink-800 hover:text-ink-400"
            >
              Pulisci
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {feedEvents.slice(0, 4).map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-2.5 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                >
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-aura-cyan" />
                  <p className="text-xs text-ink-400">{e.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Reveal>
      )}

      {openPerson && <PersonWindow person={openPerson} onClose={() => setOpenPerson(null)} />}
      {addWidgetOpen && <AddWidgetSheet onClose={() => setAddWidgetOpen(false)} />}
    </div>
  );
}
