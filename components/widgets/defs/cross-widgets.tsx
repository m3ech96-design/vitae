"use client";
import { Flame, UserCheck, Target, CalendarClock, Repeat, Home as HomeIcon, Sunrise } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useDiary } from "@/lib/diary-context";
import { useFood } from "@/lib/food-context";
import { useFinance } from "@/lib/finance-context";
import { useMedical } from "@/lib/medical-context";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { useHobby } from "@/lib/hobby-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { personWorldStatus } from "@/lib/task-presence";
import { currentEngagement } from "@/lib/presence";
import { todayIso } from "@/lib/date-format";
import { WidgetStat, WidgetList, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

/** Giorni di fila con QUALCOSA registrato da qualche parte — Diario, Alimentazione o una
 * task completata, quello che arriva prima interrompe il conteggio all'indietro. Una
 * definizione dichiaratamente ampia di "attività", non un modulo preciso: è lo spirito di
 * "streak generale" richiesto, non la somma di sei streak diversi. */
export function GeneralStreakWidget({ size }: { size: WidgetSize }) {
  const { entries: diaryEntries } = useDiary();
  const { entries: foodEntries } = useFood();
  const { tasks } = useTasks();

  const activeDates = new Set<string>([
    ...diaryEntries.map((e) => e.date),
    ...foodEntries.map((e) => e.date),
    ...tasks.filter((t) => t.completed && t.completedAt).map((t) => (t.completedAt as string).slice(0, 10)),
  ]);

  let streak = 0;
  const cursor = new Date();
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return <WidgetStat icon={Flame} value={streak} label={streak === 1 ? "Giorno attivo di fila" : "Giorni attivi di fila"} color="#FFB454" />;
}

const PROFILE_FIELDS_TO_CHECK = [
  "gender",
  "birthday",
  "alias",
  "phone",
  "birthPlace",
  "strengths",
  "weaknesses",
  "fears",
  "ambitions",
  "goals",
] as const;

export function ProfileCompletionWidget({ size }: { size: WidgetSize }) {
  const { profile } = useProfile();
  const filledScalars = PROFILE_FIELDS_TO_CHECK.filter((k) => Boolean(profile[k])).length;
  const filledLists = [profile.traits, profile.values, profile.lifestyle].filter((l) => l.length > 0).length;
  const total = PROFILE_FIELDS_TO_CHECK.length + 3;
  const pct = Math.round(((filledScalars + filledLists) / total) * 100);
  return <WidgetStat icon={UserCheck} value={`${pct}%`} label="Profilo completato" color={pct > 70 ? "#34D399" : pct > 30 ? "#FFB454" : "#8B90A8"} />;
}

export function ActiveGoalsWidget({ size }: { size: WidgetSize }) {
  const { savingsGoals } = useFinance();
  const { hobbies } = useHobby();
  const activeSavings = savingsGoals.filter((g) => g.currentAmount < g.targetAmount).length;
  let activeMetricGoals = 0;
  hobbies.forEach((h) =>
    h.blocks.forEach((b) => {
      if (b.kind === "metrica" && b.goalValue) activeMetricGoals++;
    })
  );
  const total = activeSavings + activeMetricGoals;
  return <WidgetStat icon={Target} value={total} label={total === 1 ? "Obiettivo attivo" : "Obiettivi attivi"} color="#7C5CFF" />;
}

export function NextAnyAppointmentWidget({ size }: { size: WidgetSize }) {
  const { appointments: medicalAppointments } = useMedical();
  const { appointments: animalAppointments } = useAnimalHealth();
  const { people } = useHousehold();
  const nowIso = new Date().toISOString();

  const nextMedical = [...medicalAppointments].filter((a) => !a.completed && a.date >= nowIso).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextAnimal = [...animalAppointments].filter((a) => !a.completed && a.date >= nowIso).sort((a, b) => a.date.localeCompare(b.date))[0];

  const candidates = [
    nextMedical && { title: nextMedical.title, date: nextMedical.date, who: "Tuo" },
    nextAnimal && { title: nextAnimal.title, date: nextAnimal.date, who: people.find((p) => p.id === nextAnimal.animalId)?.firstName ?? "?" },
  ].filter(Boolean) as { title: string; date: string; who: string }[];

  const next = candidates.sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return <WidgetEmpty icon={CalendarClock} label="Nessun appuntamento in programma" />;
  return <WidgetStat icon={CalendarClock} value={next.title} label={`${next.who} · ${new Date(next.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`} color="#5EC8FF" />;
}

export function NextRecurringDueWidget({ size }: { size: WidgetSize }) {
  const { vaccinations } = useAnimalHealth();
  const today = todayIso();

  const nextVaccine = [...vaccinations].filter((v) => v.nextDueDate).sort((a, b) => (a.nextDueDate as string).localeCompare(b.nextDueDate as string))[0];

  if (!nextVaccine) return <WidgetEmpty icon={Repeat} label="Nessuna scadenza ricorrente" />;
  const overdue = (nextVaccine.nextDueDate as string) <= today;
  return <WidgetStat icon={Repeat} value={nextVaccine.name} label={`Vaccino · ${nextVaccine.nextDueDate}`} color={overdue ? "#FF4D6D" : "#8B90A8"} />;
}

export function HouseholdPresenceWidget({ size }: { size: WidgetSize }) {
  const { people, home } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const humans = people.filter((p) => !ANIMAL_KINDS.includes(p.kind) && p.livesAtHome);
  if (humans.length === 0) return <WidgetEmpty icon={HomeIcon} label="Nessun membro in casa impostato" />;
  const atHome = humans.filter((p) => {
    const eng = currentEngagement(p);
    const engPlaceId = eng?.linkedPlaceId ? places.find((pl) => pl.id === eng.linkedPlaceId)?.id ?? null : null;
    return personWorldStatus(p, tasks, home?.placeId, engPlaceId) === "casa";
  }).length;
  const pct = Math.round((atHome / humans.length) * 100);
  return <WidgetStat icon={HomeIcon} value={`${pct}%`} label={`${atHome}/${humans.length} in casa ora`} color="#7C5CFF" />;
}

export function TodayAtGlanceWidget({ size }: { size: WidgetSize }) {
  const { tasks } = useTasks();
  const { appointments } = useMedical();
  const { people } = useHousehold();
  const today = todayIso();

  const todayTasks = tasks.filter((t) => t.date === today && !t.completed).map((t) => ({ id: t.id, label: t.title, meta: t.time, color: t.color }));
  const todayAppointments = appointments
    .filter((a) => a.date.slice(0, 10) === today && !a.completed)
    .map((a) => ({ id: a.id, label: a.title, meta: "Appuntamento", color: "#5EC8FF" }));
  const hungryAnimals = people
    .filter((p) => ANIMAL_KINDS.includes(p.kind))
    .filter((a) => a.feedingTimes.length > 0)
    .map((a) => ({ id: a.id, label: `Pappa di ${a.firstName}`, color: "#FFB454" }));

  const items = [...todayAppointments, ...todayTasks, ...hungryAnimals];
  return <WidgetList title="Cosa ti aspetta oggi" icon={Sunrise} items={items} emptyLabel="Giornata libera" />;
}
