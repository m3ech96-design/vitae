"use client";
import { useMemo, useState } from "react";
import { CalendarDays, BookOpen, PenLine, Sparkles } from "lucide-react";
import { useDiary } from "@/lib/diary-context";
import { todayIso, formatDateShort } from "@/lib/date-format";
import { DiaryComposer } from "@/components/diario/DiaryComposer";
import { DiaryEntryCard } from "@/components/diario/DiaryEntryCard";
import { DiaryCalendar } from "@/components/diario/DiaryCalendar";
import { DiarySfoglia } from "@/components/diario/DiarySfoglia";
import { Switch } from "@/components/ui/Switch";

type Tab = "oggi" | "calendario" | "sfoglia";

const TABS: { id: Tab; label: string; icon: typeof PenLine }[] = [
  { id: "oggi", label: "Oggi", icon: PenLine },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "sfoglia", label: "Sfoglia", icon: BookOpen },
];

export default function DiarioPage() {
  const { hydrated, entries, scrubPreviewEnabled, setScrubPreviewEnabled } = useDiary();
  const [tab, setTab] = useState<Tab>("oggi");
  const [showSettings, setShowSettings] = useState(false);

  const today = todayIso();
  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today).sort((a, b) => b.time.localeCompare(a.time)),
    [entries, today]
  );

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Diario</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">{formatDateShort(today)}</h1>
        </div>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-600 hover:text-ink-200"
          aria-label="Impostazioni diario"
        >
          <Sparkles size={15} />
        </button>
      </div>

      {showSettings && (
        <div className="mt-3 flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm text-ink-100">Anteprime video animate</p>
            <p className="text-[11px] text-ink-800">Le miniature dei video scorrono tra più fotogrammi invece di restare ferme.</p>
          </div>
          <Switch checked={scrubPreviewEnabled} onChange={setScrubPreviewEnabled} />
        </div>
      )}

      <div className="mt-5 flex gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
              tab === id ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "oggi" && (
          <div className="space-y-4">
            <DiaryComposer date={today} />
            {todayEntries.length > 0 && (
              <div className="space-y-3">
                {todayEntries.map((e) => (
                  <DiaryEntryCard key={e.id} entry={e} />
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "calendario" && <DiaryCalendar />}
        {tab === "sfoglia" && <DiarySfoglia />}
      </div>
    </div>
  );
}
