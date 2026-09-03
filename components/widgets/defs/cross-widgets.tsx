"use client";
import { Flame, UserCheck, Target, CalendarClock, Repeat, Home as HomeIcon, Sunrise, Image as ImageIcon, BarChart3 } from "lucide-react";
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
import { useWishlist } from "@/lib/wishlist-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { personWorldStatus } from "@/lib/task-presence";
import { currentEngagement } from "@/lib/presence";
import { todayIso } from "@/lib/date-format";
import { computeMonthlySpending } from "@/lib/finance";
import { useResolvedImage } from "@/lib/use-resolved-image";
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

function RecentPhotoPreview({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <WidgetEmpty icon={ImageIcon} label="Carico..." />;
  return (
    <div className="h-full w-full overflow-hidden rounded-xl2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

/** L'ultima foto aggiunta ovunque nell'app — Diario, progetti Hobby, Wishlist — scelta per
 * data più recente tra le tre fonti. Referti di Salute/Animali restano fuori: aggiungerli
 * avrebbe richiesto risolvere immagini da un quarto e quinto contesto per un beneficio
 * marginale, dato che le prime tre coprono già la stragrande maggioranza delle foto reali. */
export function RecentPhotoWidget({ size }: { size: WidgetSize }) {
  const { entries: diaryEntries } = useDiary();
  const { hobbies } = useHobby();
  const { items: wishlistItems } = useWishlist();

  const candidates: { key: string; date: string }[] = [];
  diaryEntries.forEach((e) => e.media.filter((m) => m.type === "image").forEach((m) => candidates.push({ key: m.key, date: e.date })));
  hobbies.forEach((h) =>
    h.blocks.forEach((b) => {
      if (b.kind === "progetti") b.projects.forEach((p) => p.photoKeys.forEach((k) => candidates.push({ key: k, date: p.createdAt.slice(0, 10) })));
    })
  );
  wishlistItems.forEach((i) => {
    if (i.photoKey) candidates.push({ key: i.photoKey, date: i.createdAt.slice(0, 10) });
  });

  const best = [...candidates].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!best) return <WidgetEmpty icon={ImageIcon} label="Nessuna foto ancora" />;
  return <RecentPhotoPreview photoKey={best.key} />;
}

export function BudgetLast3CyclesWidget({ size }: { size: WidgetSize }) {
  const { cycleStartDay, recurringExpenses, singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();

  const cycles: { label: string; total: number }[] = [];
  let ref = new Date();
  for (let i = 0; i < 3; i++) {
    const { total, range } = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay, ref);
    cycles.unshift({ label: i === 0 ? "Ora" : `-${i}`, total });
    const prevRef = new Date(range.start);
    prevRef.setDate(prevRef.getDate() - 1);
    ref = prevRef;
  }
  const max = Math.max(...cycles.map((c) => c.total), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="flex items-center gap-1.5 text-[11px] text-ink-600">
        <BarChart3 size={12} /> Spesa — ultimi 3 cicli
      </p>
      <div className="flex items-end justify-center gap-4" style={{ height: 56 }}>
        {cycles.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-7 rounded-t-md bg-aura-gradient" style={{ height: `${Math.max(4, (c.total / max) * 44)}px` }} />
            <span className="text-[9px] text-ink-800">{Math.round(c.total)}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Versione compatta di una timeline settimanale: tre righe di puntini (task completate,
 * pasto registrato, nota di diario) per ognuno degli ultimi 7 giorni — non un grafico a
 * scorrimento con orari precisi (irrealizzabile nello spazio di un widget), ma un vero
 * colpo d'occhio su quali giorni sono stati "vissuti" in che modo. */
export function WeeklyTimelineWidget({ size }: { size: WidgetSize }) {
  const { entries: diaryEntries } = useDiary();
  const { entries: foodEntries } = useFood();
  const { tasks } = useTasks();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const hasDiary = new Set(diaryEntries.map((e) => e.date));
  const hasFood = new Set(foodEntries.map((e) => e.date));
  const hasTask = new Set(tasks.filter((t) => t.completed && t.completedAt).map((t) => (t.completedAt as string).slice(0, 10)));

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-[11px] text-ink-600">Questa settimana</p>
      <div className="flex justify-between px-1">
        {days.map((d) => (
          <div key={d} className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] text-ink-800">{new Date(d + "T12:00:00").toLocaleDateString("it-IT", { weekday: "narrow" })}</span>
            <div className="flex flex-col items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasTask.has(d) ? "#00E5C7" : "rgba(255,255,255,0.08)" }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasFood.has(d) ? "#FFB454" : "rgba(255,255,255,0.08)" }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasDiary.has(d) ? "#7C5CFF" : "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
