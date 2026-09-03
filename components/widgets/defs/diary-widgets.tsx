"use client";
import { useState } from "react";
import { BookHeart, Flame, History, Send } from "lucide-react";
import { useDiary } from "@/lib/diary-context";
import { todayIso } from "@/lib/date-format";
import { WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function TodayNoteWidget({ size }: { size: WidgetSize }) {
  const { entries } = useDiary();
  const today = todayIso();
  const todays = entries.filter((e) => e.date === today);
  if (todays.length === 0) return <WidgetEmpty icon={BookHeart} label="Non hai ancora scritto oggi" />;
  const last = [...todays].sort((a, b) => b.time.localeCompare(a.time))[0];
  return <WidgetStat icon={BookHeart} value={last.text.slice(0, 40) || "Nota senza testo"} label={`Oggi alle ${last.time}`} color="#7C5CFF" />;
}

export function DiaryStreakWidget({ size }: { size: WidgetSize }) {
  const { entries } = useDiary();
  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return <WidgetStat icon={Flame} value={streak} label={streak === 1 ? "Giorno di scrittura" : "Giorni di scrittura"} color="#FFB454" />;
}

export function OneYearAgoWidget({ size }: { size: WidgetSize }) {
  const { entries } = useDiary();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const iso = oneYearAgo.toISOString().slice(0, 10);
  const found = entries.filter((e) => e.date === iso);
  if (found.length === 0) return <WidgetEmpty icon={History} label="Nessuna nota da un anno fa" />;
  const note = found[0];
  return <WidgetStat icon={History} value={note.text.slice(0, 40) || "Nota senza testo"} label="Un anno fa oggi" color="#B79A6B" />;
}

export function QuickDiaryNoteWidget({ size }: { size: WidgetSize }) {
  const { addEntry } = useDiary();
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    const now = new Date();
    addEntry({
      date: todayIso(),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      text: text.trim(),
      media: [],
    });
    setText("");
  };
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-1">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Una riga veloce..."
        className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-ink-100 placeholder:text-ink-800"
      />
      <button onClick={submit} disabled={!text.trim()} className="focus-ring flex items-center gap-1 text-[11px] text-aura-violet disabled:opacity-30">
        <Send size={11} /> Scrivi
      </button>
    </div>
  );
}
