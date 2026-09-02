"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiary } from "@/lib/diary-context";
import { todayIso } from "@/lib/date-format";
import { DiaryEntryCard } from "./DiaryEntryCard";
import { DiaryComposer } from "./DiaryComposer";

const WEEKDAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function isoOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

export function DiaryCalendar() {
  const { entries } = useDiary();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso());

  const entryDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lunedì come primo giorno della settimana: getDay() dà 0 per domenica, la ruotiamo.
  const leadingBlank = (firstOfMonth.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(leadingBlank).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const dayEntries = useMemo(
    () => (selectedDate ? entries.filter((e) => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : []),
    [entries, selectedDate]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <button onClick={goPrevMonth} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-600 hover:text-ink-200" aria-label="Mese precedente">
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-sm capitalize text-ink-100">{monthLabel(year, month)}</p>
        <button onClick={goNextMonth} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-600 hover:text-ink-200" aria-label="Mese successivo">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-ink-800">
        {WEEKDAY_LETTERS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const iso = isoOf(year, month, day);
          const hasEntry = entryDates.has(iso);
          const isToday = iso === todayIso();
          const isSelected = iso === selectedDate;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={`relative flex h-9 items-center justify-center rounded-xl2 text-xs transition ${
                isSelected
                  ? "border border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                  : isToday
                    ? "border border-aura-cyan/40 text-ink-200"
                    : "border border-transparent text-ink-400 hover:border-white/10"
              }`}
            >
              {day}
              {hasEntry && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-aura-cyan" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-5 space-y-3">
          {dayEntries.length > 0 ? (
            dayEntries.map((e) => <DiaryEntryCard key={e.id} entry={e} />)
          ) : (
            <p className="text-sm text-ink-800">Ancora nessuna nota per questo giorno.</p>
          )}
          <DiaryComposer date={selectedDate} />
        </div>
      )}
    </div>
  );
}
