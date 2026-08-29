"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Wallet, Sparkles, Pencil, Home as HomeIcon, DoorOpen, Plus, LocateFixed } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { useFeed } from "@/lib/feed-context";
import { computeAge } from "@/lib/text";
import { Person } from "@/lib/types";
import { personWorldStatus, userTaskDrivenLocation } from "@/lib/task-presence";
import { currentEngagement } from "@/lib/presence";
import { usePlaces } from "@/lib/places-context";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PlaceIconBadge } from "@/components/ui/PlaceIconBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LinkHomeCard } from "@/components/household/LinkHomeCard";
import { AddPersonModal } from "@/components/persone/AddPersonModal";
import { PersonWindow } from "@/components/persone/PersonWindow";
import { UserOverviewModal } from "@/components/home/UserOverviewModal";
import { HouseholdAvatarCell } from "@/components/household/HouseholdAvatarCell";
import { TaskCountdownLog } from "@/components/home/TaskCountdownLog";
import { TodaySummaryCard } from "@/components/home/TodaySummaryCard";
import { RapportNudgeCard } from "@/components/home/RapportNudgeCard";
import { WeeklyNeedsCard } from "@/components/home/WeeklyNeedsCard";
import { VitaecomNotificationsCard } from "@/components/home/VitaecomNotificationsCard";
import { PersonalCardMenu } from "@/components/home/PersonalCardMenu";
import { useMood } from "@/lib/mood-context";
import { moodBackgroundLayers, moodBackgroundOpacity } from "@/lib/mood-tone";

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return "Buongiorno";
  if (hour >= 12 && hour < 18) return "Buon Pomeriggio";
  if (hour >= 18 && hour < 22) return "Buonasera";
  return "Buonanotte";
}

const SHORTCUTS = [
  { href: "/salute", icon: HeartPulse, label: "Salute", desc: "Attività E Peso" },
  { href: "/finanze", icon: Wallet, label: "Finanze", desc: "Budget E Risparmi" },
  { href: "/rapporti", icon: Sparkles, label: "Rapporti", desc: "Legami E Animali" },
];

export default function HomePage() {
  const { profile, hydrated: profileHydrated } = useProfile();
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
  const [addOpen, setAddOpen] = useState(false);
  const [openPerson, setOpenPerson] = useState<Person | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const { events: feedEvents, clearEvents } = useFeed();
  const { tasks } = useTasks();
  const { places } = usePlaces();
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
  const atHome = people.filter((p) => statusOf(p) === "casa");
  const awayPeople = people.filter((p) => statusOf(p) === "fuori-casa");
  const userTaskLocation = userTaskDrivenLocation(tasks, home?.placeId);
  const userIsHome = userTaskLocation ? userTaskLocation === "casa" : !userIsAway;

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
          {/* Prima era un <button>: un <button> dentro l'altro (PersonalCardMenu ne rende
             uno suo) non è HTML valido — il browser confondeva i due click, e il pulsante
             del menù apriva la scheda utente invece del proprio menù. Un <div> col ruolo
             giusto risolve senza perdere accessibilità. */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOverviewOpen(true)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOverviewOpen(true)}
            className="focus-ring relative flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <span className="relative inline-flex shrink-0">
              <AuraAvatar
                imageUrl={profile.avatarUrl}
                firstName={profile.firstName}
                lastName={profile.lastName}
                size={72}
                ring={userIsHome ? "home" : "away"}
              />
              <PlaceIconBadge place={currentPlaceIcon} size={72} />
              <PersonalCardMenu />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-ink-100">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-ink-600">{age !== null ? `${age} Anni` : "Età Non Impostata"}</p>
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

      {!home ? (
        <Reveal delay={0.1} className="mt-6">
          <LinkHomeCard />
        </Reveal>
      ) : (
        <Reveal delay={0.1} className="mt-6 grid grid-cols-3 gap-3">
          <GlassCard glow={userIsHome ? "violet" : "none"} className="col-span-2 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HomeIcon size={16} className="text-aura-violet" />
                <p className="font-display text-sm text-ink-100">Casa</p>
              </div>
              <button
                onClick={() => setTrackingEnabled(!trackingEnabled)}
                className={`focus-ring flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition ${
                  trackingEnabled
                    ? "border-aura-cyan/50 text-aura-cyan"
                    : "border-white/10 text-ink-800"
                }`}
                title="Attiva Il Rilevamento Della Tua Posizione"
              >
                <LocateFixed size={11} />
                {trackingEnabled ? "Rilevamento Attivo" : "Rilevamento Spento"}
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {userIsHome && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="relative inline-flex">
                    <AuraAvatar
                      imageUrl={profile.avatarUrl}
                      firstName={profile.firstName}
                      lastName={profile.lastName}
                      size={60}
                      ring="home"
                    />
                    <PlaceIconBadge place={currentPlaceIcon} size={60} />
                  </span>
                  <span className="max-w-[64px] truncate text-[11px] text-ink-600">Tu</span>
                </div>
              )}
              {atHome.map((p) => (
                <HouseholdAvatarCell key={p.id} person={p} location="casa" onOpen={setOpenPerson} />
              ))}
              <button
                onClick={() => setAddOpen(true)}
                className="focus-ring flex flex-col items-center gap-1.5"
              >
                <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50 hover:text-ink-200">
                  <Plus size={18} />
                </span>
                <span className="text-[11px] text-ink-600">Aggiungi</span>
              </button>
            </div>
            {trackingError && (
              <p className={`mt-3 text-[11px] ${trackingPermissionDenied ? "text-aura-pink" : "text-ink-800"}`}>
                {trackingError}
              </p>
            )}
          </GlassCard>

          <GlassCard glow={!userIsHome ? "pink" : "none"} className="p-4">
            <div className="mb-4 flex items-center gap-1.5">
              <DoorOpen size={14} className="text-aura-pink" />
              <p className="font-display text-xs text-ink-100">Fuori Casa</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              {!userIsHome && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="relative inline-flex">
                    <AuraAvatar
                      imageUrl={profile.avatarUrl}
                      firstName={profile.firstName}
                      lastName={profile.lastName}
                      size={52}
                      ring="away"
                    />
                    <PlaceIconBadge place={currentPlaceIcon} size={52} />
                  </span>
                  <span className="text-[11px] text-ink-600">Tu</span>
                </div>
              )}
              {awayPeople.map((p) => (
                <HouseholdAvatarCell key={p.id} person={p} location="fuori-casa" onOpen={setOpenPerson} />
              ))}
              {userIsHome && awayPeople.length === 0 && (
                <p className="py-3 text-center text-[11px] text-ink-800">
                  Nessuno È Fuori Casa
                </p>
              )}
            </div>
          </GlassCard>
        </Reveal>
      )}

      <Reveal delay={0.15} className="mt-9 space-y-4">
        <TodaySummaryCard />
        <TaskCountdownLog />
        <RapportNudgeCard />
        <WeeklyNeedsCard />
        <VitaecomNotificationsCard />
      </Reveal>

      <Reveal delay={0.2}>
        <p className="mb-3 mt-9 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Scorciatoie
        </p>
        <div className="grid grid-cols-3 gap-3">
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

      {addOpen && (
        <AddPersonModal onClose={() => setAddOpen(false)} title="Aggiungi Alla Casa" lockLivesAtHome />
      )}
      {openPerson && <PersonWindow person={openPerson} onClose={() => setOpenPerson(null)} />}
      {overviewOpen && <UserOverviewModal onClose={() => setOverviewOpen(false)} />}
    </div>
  );
}
