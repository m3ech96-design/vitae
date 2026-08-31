"use client";
import { X, Film, Music, Book, Gamepad2, MapPinned, Users, Flame, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/profile-context";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { useTasks } from "@/lib/tasks-context";
import { useHealth } from "@/lib/health-context";
import { computeAge } from "@/lib/text";
import { AuraAvatar } from "../ui/AuraAvatar";
import { GlassCard } from "../ui/GlassCard";
import { BackupSection } from "./BackupSection";

export function UserOverviewModal({ onClose }: { onClose: () => void }) {
  const { profile } = useProfile();
  const { people, home } = useHousehold();
  const { places } = usePlaces();
  const { tasks, streakFor } = useTasks();
  const { workouts, weightEntries, weightGoal } = useHealth();

  const age = computeAge(profile.birthday);
  const completedTasks = tasks.filter((t) => t.completed).length;
  const bestStreak = Math.max(0, ...tasks.filter((t) => t.type === "quotidiana").map(streakFor));
  const ratedPlaces = places.filter((p) => p.rating !== null);
  const avgRating =
    ratedPlaces.length > 0 ? Math.round(ratedPlaces.reduce((s, p) => s + (p.rating ?? 0), 0) / ratedPlaces.length) : null;
  const currentWeight = weightEntries.length > 0 ? [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0].value : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Resoconto generale</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 relative z-10 flex flex-col items-center px-6 pt-4">
          <AuraAvatar imageUrl={profile.avatarUrl} firstName={profile.firstName} lastName={profile.lastName} size={84} ring="home" />
          <p className="mt-3 font-display text-xl text-ink-100">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-xs text-ink-600">
            {age !== null ? `${age} Anni` : "Età Non Impostata"}
            {profile.gender ? ` · ${profile.gender}` : ""}
          </p>
          {profile.traits.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {profile.traits.slice(0, 6).map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-ink-400">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {(profile.educationTitle || profile.studiedAt || profile.currentWorkplace || profile.occupation) && (
            <div className="space-y-1 text-sm">
              <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">Istruzione e lavoro</p>
              {profile.educationTitle && <p className="text-ink-300">{profile.educationTitle}</p>}
              {profile.occupation && <p className="text-ink-300">{profile.occupation}</p>}
              {profile.studiedAt && <p className="text-ink-600">Ha Studiato A {profile.studiedAt}</p>}
              {profile.currentWorkplace && <p className="text-ink-600">Lavora A {profile.currentWorkplace}</p>}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <GlassCard className="flex flex-col items-center gap-1 p-2.5 text-center">
              <Film size={15} className="text-aura-pink" />
              <span className="font-display text-sm text-ink-100">{profile.favoriteMovies.length}</span>
              <span className="text-[9px] text-ink-800">Film</span>
            </GlassCard>
            <GlassCard className="flex flex-col items-center gap-1 p-2.5 text-center">
              <Music size={15} className="text-aura-violet" />
              <span className="font-display text-sm text-ink-100">{profile.favoriteMusic.length}</span>
              <span className="text-[9px] text-ink-800">Musica</span>
            </GlassCard>
            <GlassCard className="flex flex-col items-center gap-1 p-2.5 text-center">
              <Book size={15} className="text-aura-amber" />
              <span className="font-display text-sm text-ink-100">{profile.favoriteBooks.length}</span>
              <span className="text-[9px] text-ink-800">Libri</span>
            </GlassCard>
            <GlassCard className="flex flex-col items-center gap-1 p-2.5 text-center">
              <Gamepad2 size={15} className="text-aura-cyan" />
              <span className="font-display text-sm text-ink-100">{profile.favoriteGames.length}</span>
              <span className="text-[9px] text-ink-800">Giochi</span>
            </GlassCard>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Nel Mondo</p>
            <div className="grid grid-cols-2 gap-2">
              <GlassCard className="flex items-center gap-2.5 p-3">
                <MapPinned size={16} className="text-aura-emerald" />
                <div>
                  <p className="font-display text-sm text-ink-100">{places.length}</p>
                  <p className="text-[10px] text-ink-800">Luoghi{avgRating !== null ? ` · ${avgRating}%` : ""}</p>
                </div>
              </GlassCard>
              <GlassCard className="flex items-center gap-2.5 p-3">
                <Users size={16} className="text-aura-violet" />
                <div>
                  <p className="font-display text-sm text-ink-100">{people.length}</p>
                  <p className="text-[10px] text-ink-800">Nel Mondo</p>
                </div>
              </GlassCard>
            </div>
            {home && <p className="mt-2 text-xs text-ink-800">Casa: {home.address}</p>}
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Ritmo e salute</p>
            <div className="grid grid-cols-2 gap-2">
              <GlassCard className="flex items-center gap-2.5 p-3">
                <Flame size={16} className="text-aura-amber" />
                <div>
                  <p className="font-display text-sm text-ink-100">{completedTasks}</p>
                  <p className="text-[10px] text-ink-800">Task Completate{bestStreak >= 2 ? ` · Streak ${bestStreak}` : ""}</p>
                </div>
              </GlassCard>
              <GlassCard className="flex items-center gap-2.5 p-3">
                <HeartPulse size={16} className="text-aura-cyan" />
                <div>
                  <p className="font-display text-sm text-ink-100">{workouts.length}</p>
                  <p className="text-[10px] text-ink-800">
                    Attività{currentWeight !== null ? ` · ${currentWeight}Kg` : ""}
                    {weightGoal !== null ? ` → ${weightGoal}Kg` : ""}
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>

          <BackupSection />
        </div>
      </motion.div>
    </div>
  );
}
