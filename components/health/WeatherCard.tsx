"use client";
import { useMemo, useState } from "react";
import { MapPin, Wind, Droplets } from "lucide-react";
import { useWeather } from "@/lib/use-weather";
import { weatherCodeInfo } from "@/lib/weather-code";
import { currentAdvice, bestHoursAdvice, HourlyPoint } from "@/lib/weather-advice";
import { weekdayShort } from "@/lib/date-format";
import { GlassCard } from "../ui/GlassCard";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

const ADVICE_TONE_COLOR: Record<"buono" | "cauto" | "sconsigliato", string> = {
  buono: "text-aura-emerald",
  cauto: "text-aura-amber",
  sconsigliato: "text-aura-pink",
};

function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

/** Le ore da adesso in poi, raggruppate per giorno (oggi, domani, dopodomani) — le ore già
 * passate di oggi non interessano né la card né lo sheet: la richiesta è "il meteo attuale e
 * le previsioni per il resto della giornata", non l'intera giornata da mezzanotte. */
function groupUpcomingByDay(hourly: HourlyPoint[], nowIso: string): { dayLabel: string; points: HourlyPoint[] }[] {
  const upcoming = hourly.filter((p) => p.time >= nowIso.slice(0, 13)); // confronto su "YYYY-MM-DDTHH", stesso fuso già risolto da Open-Meteo (timezone=auto)
  const byDay = new Map<string, HourlyPoint[]>();
  upcoming.forEach((p) => {
    const day = p.time.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(p);
    byDay.set(day, list);
  });

  const today = nowIso.slice(0, 10);
  return [...byDay.entries()].map(([day, points]) => ({
    dayLabel: day === today ? "Oggi" : weekdayShort(`${day}T12:00:00`),
    points,
  }));
}

function HourRow({ point }: { point: HourlyPoint }) {
  const info = weatherCodeInfo(point.weatherCode);
  const Icon = info.icon;
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-3">
      <p className="text-[10px] text-ink-600">{hourLabel(point.time)}</p>
      <Icon size={18} className="text-aura-cyan" />
      <p className="font-display text-sm text-ink-100">{Math.round(point.temperature)}°</p>
      {point.precipitation > 0 && (
        <p className="flex items-center gap-0.5 text-[9px] text-aura-cyan">
          <Droplets size={9} /> {point.precipitation.toFixed(1)}
        </p>
      )}
    </div>
  );
}

export function WeatherCard() {
  const { data, loading, error } = useWeather();
  const [open, setOpen] = useState(false);

  const advice = useMemo(() => {
    if (!data) return null;
    return currentAdvice(data.current, weatherCodeInfo(data.current.weatherCode).category);
  }, [data]);

  const days = useMemo(() => {
    if (!data) return [];
    return groupUpcomingByDay(data.hourly, data.current.time);
  }, [data]);

  const todayAdvice = useMemo(() => {
    if (!data || days.length === 0) return null;
    return bestHoursAdvice(days[0].points, (code) => weatherCodeInfo(code).category);
  }, [data, days]);

  if (loading) {
    return (
      <GlassCard className="flex items-center gap-3 p-4">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
        <p className="text-xs text-ink-600">Rilevamento meteo…</p>
      </GlassCard>
    );
  }

  if (error || !data || !advice) {
    return (
      <GlassCard className="flex items-center gap-3 p-4">
        <MapPin size={18} className="shrink-0 text-ink-800" />
        <p className="text-xs text-ink-600">{error ?? "Meteo non disponibile."}</p>
      </GlassCard>
    );
  }

  const info = weatherCodeInfo(data.current.weatherCode);
  const Icon = info.icon;

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <GlassCard className="flex items-center gap-3.5 p-4 transition hover:border-white/20">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-aura-cyan/15">
            <Icon size={22} className="text-aura-cyan" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="font-display text-lg text-ink-100">{Math.round(data.current.temperature)}°</p>
              <p className="truncate text-xs text-ink-600">{info.label} · {data.placeLabel}</p>
            </div>
            <p className={`mt-1 text-xs ${ADVICE_TONE_COLOR[advice.tone]}`}>{advice.text}</p>
          </div>
        </GlassCard>
      </button>

      {open && (
        <PersonalCardSheet title="Meteo" onClose={() => setOpen(false)}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl2 bg-aura-cyan/15">
                <Icon size={28} className="text-aura-cyan" />
              </span>
              <div>
                <p className="font-display text-2xl text-ink-100">{Math.round(data.current.temperature)}°</p>
                <p className="text-xs text-ink-600">{info.label} · {data.placeLabel}</p>
              </div>
            </div>

            <div className={`rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-sm ${ADVICE_TONE_COLOR[advice.tone]}`}>
              {advice.text}
            </div>

            {todayAdvice && todayAdvice.text !== advice.text && (
              <div className={`flex items-start gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs ${ADVICE_TONE_COLOR[todayAdvice.tone]}`}>
                <Wind size={13} className="mt-0.5 shrink-0" />
                <p>{todayAdvice.text}</p>
              </div>
            )}

            {days.map((day) => (
              <div key={day.dayLabel}>
                <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">{day.dayLabel}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {day.points.map((p) => (
                    <HourRow key={p.time} point={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PersonalCardSheet>
      )}
    </>
  );
}
