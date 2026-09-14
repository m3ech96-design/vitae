"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListChecks, Utensils, Dumbbell, Wallet, BookHeart, Palette, Heart, TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { useFood } from "@/lib/food-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { useDiary } from "@/lib/diary-context";
import { useHobby } from "@/lib/hobby-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useHealth } from "@/lib/health-context";
import { weeklyDashboard } from "@/lib/weekly-dashboard";
import { formatDateShort } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  detail,
  href,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  detail?: React.ReactNode;
  href: string;
}) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(href)} className="focus-ring text-left">
      <GlassCard className="h-full p-4 transition hover:border-white/20">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl2" style={{ background: `${color}22` }}>
          <Icon size={15} className="shrink-0" style={{ color }} />
        </span>
        <p className="mt-2.5 text-[11px] uppercase tracking-[0.1em] text-ink-600">{label}</p>
        <p className="mt-0.5 font-display text-lg text-ink-100">{value}</p>
        {detail && <div className="mt-0.5 text-[11px] text-ink-600">{detail}</div>}
      </GlassCard>
    </button>
  );
}

export default function WeeklyDashboardPage() {
  const router = useRouter();
  const { hydrated: tasksHydrated, tasks } = useTasks();
  const { hydrated: foodHydrated, entries: foodEntries, ingredients } = useFood();
  const { hydrated: placesHydrated, places } = usePlaces();
  const { hydrated: financeHydrated, singleExpenses, plannedExpenses } = useFinance();
  const { hydrated: diaryHydrated, entries: diaryEntries } = useDiary();
  const { hydrated: hobbyHydrated, hobbies } = useHobby();
  const { hydrated: wishlistHydrated, items: wishlistItems } = useWishlist();
  const { hydrated: healthHydrated, workouts } = useHealth();

  const hydrated =
    tasksHydrated &&
    foodHydrated &&
    placesHydrated &&
    financeHydrated &&
    diaryHydrated &&
    hobbyHydrated &&
    wishlistHydrated &&
    healthHydrated;

  const dashboard = useMemo(() => {
    if (!hydrated) return null;
    return weeklyDashboard({
      tasks,
      foodEntries,
      ingredients,
      workouts,
      places,
      singleExpenses,
      plannedExpenses,
      diaryEntries,
      hobbies,
      wishlistItems,
    });
  }, [hydrated, tasks, foodEntries, ingredients, workouts, places, singleExpenses, plannedExpenses, diaryEntries, hobbies, wishlistItems]);

  if (!hydrated || !dashboard) return null;

  const activityDelta = dashboard.activity.minutesThisWeek - dashboard.activity.minutesPreviousWeek;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
        <ArrowLeft size={15} /> Indietro
      </button>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Riepilogo</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">La tua settimana</h1>
      <p className="mt-1 text-xs text-ink-800">
        {formatDateShort(dashboard.range.start)} — {formatDateShort(dashboard.range.end)}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={ListChecks}
          color="#7C5CFF"
          label="Task"
          value={dashboard.tasks.completionRate !== null ? `${Math.round(dashboard.tasks.completionRate * 100)}%` : "—"}
          detail={dashboard.tasks.completionRate === null ? "Nessun dato ancora" : "completate"}
          href="/task"
        />
        <StatCard
          icon={Utensils}
          color="#34D399"
          label="Alimentazione"
          value={dashboard.food.daysWithEntries > 0 ? `${Math.round(dashboard.food.avgKcalPerDay)} kcal` : "—"}
          detail={dashboard.food.daysWithEntries > 0 ? `media su ${dashboard.food.daysWithEntries} giorni` : "Nessuna registrazione"}
          href="/alimentazione"
        />
        <StatCard
          icon={Dumbbell}
          color="#00E5C7"
          label="Attività"
          value={`${dashboard.activity.minutesThisWeek} min`}
          detail={
            dashboard.activity.minutesPreviousWeek > 0 ? (
              <span className="flex items-center gap-1">
                {activityDelta >= 0 ? (
                  <TrendingUp size={11} className="text-aura-emerald" />
                ) : (
                  <TrendingDown size={11} className="text-aura-pink" />
                )}
                {activityDelta >= 0 ? "+" : ""}
                {activityDelta} min vs sett. prima
              </span>
            ) : (
              "Nessun confronto disponibile"
            )
          }
          href="/attivita-peso"
        />
        <StatCard
          icon={Wallet}
          color="#FFB454"
          label="Finanze"
          value={`${Math.round(dashboard.finance.totalSpent)}€`}
          detail="speso questa settimana"
          href="/finanze"
        />
        <StatCard
          icon={BookHeart}
          color="#FF6B9D"
          label="Diario"
          value={`${dashboard.diary.entriesCount}`}
          detail={dashboard.diary.entriesCount === 1 ? "voce scritta" : "voci scritte"}
          href="/diario"
        />
        <StatCard
          icon={Palette}
          color="#5EC8FF"
          label="Hobby"
          value={`${dashboard.hobby.activitiesCount}`}
          detail="attività registrate"
          href="/hobby"
        />
        {dashboard.wishlist.fulfilledCount > 0 && (
          <StatCard
            icon={Heart}
            color="#FFD86B"
            label="Wishlist"
            value={`${dashboard.wishlist.fulfilledCount}`}
            detail={`realizzat${dashboard.wishlist.fulfilledCount === 1 ? "o" : "i"} · ${Math.round(dashboard.wishlist.fulfilledAmount)}€`}
            href="/wishlist"
          />
        )}
      </div>
    </div>
  );
}
