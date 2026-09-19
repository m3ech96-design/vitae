"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  LayoutDashboard,
  Wallet,
  HeartPulse,
  Utensils,
  BookHeart,
  Newspaper,
  LocateFixed,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  ListFilter,
  Home as HomeIcon,
  Coffee,
  PiggyBank,
  Dumbbell,
  Scale,
  LucideIcon,
} from "lucide-react";
import { useFinance, SalarySplit } from "@/lib/finance-context";
import { useHealth, WeeklyGoalType, WeeklyActivityGoal } from "@/lib/health-context";
import { useFood } from "@/lib/food-context";
import { useDiary } from "@/lib/diary-context";
import { useNewsSources } from "@/lib/news-sources-context";
import { useHousehold } from "@/lib/household-context";
import { useWidgets } from "@/lib/widgets/widgets-context";
import { useShortcuts } from "@/lib/shortcuts-context";
import { SHORTCUT_CATALOG } from "@/lib/shortcuts-catalog";
import { usePersistedChoice } from "@/lib/use-persisted-choice";
import { WISHLIST_SORT_LABEL, WishlistSortMode } from "@/lib/wishlist-sort";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { Reveal } from "@/components/ui/Reveal";
import { AddWidgetSheet } from "@/components/widgets/AddWidgetSheet";
import { FoodGoalsModal } from "@/components/food/FoodGoalsModal";
import { BackupSection } from "@/components/home/BackupSection";

const ACCENT = {
  violet: "bg-aura-violet/15 text-aura-violet",
  cyan: "bg-aura-cyan/15 text-aura-cyan",
  pink: "bg-aura-pink/15 text-aura-pink",
  amber: "bg-aura-amber/15 text-aura-amber",
  emerald: "bg-aura-emerald/15 text-aura-emerald",
  sky: "bg-aura-sky/15 text-aura-sky",
} as const;

type Tone = keyof typeof ACCENT;

/** L'intestazione di ogni sezione — icona colorata in una bolla, titolo, sottotitolo — la
 * stessa forma usata in giro per l'app (vedi le GlassCard di app/tiber/impostazioni/page.tsx)
 * ma fattorizzata qui una volta sola: questa pagina ne ha più di dieci, scriverla a mano ogni
 * volta avrebbe significato la stessa manciata di righe ripetuta undici volte. */
function SectionHeader({ icon: Icon, tone, title, subtitle }: { icon: LucideIcon; tone: Tone; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ACCENT[tone]}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="font-display text-sm text-ink-100">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] leading-relaxed text-ink-600">{subtitle}</p>}
      </div>
    </div>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-sm text-ink-100">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-ink-800">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

type SplitKey = keyof SalarySplit;
const SPLIT_FIELDS: { key: SplitKey; label: string; icon: LucideIcon; color: string }[] = [
  { key: "speseFisse", label: "Spese fisse", icon: HomeIcon, color: "#7C5CFF" },
  { key: "tempoLibero", label: "Tempo libero", icon: Coffee, color: "#00E5C7" },
  { key: "risparmi", label: "Risparmi", icon: PiggyBank, color: "#34D399" },
];

const WEEKLY_GOAL_TYPES: { id: WeeklyGoalType; label: string }[] = [
  { id: "minuti", label: "Minuti" },
  { id: "sessioni", label: "Sessioni" },
  { id: "calorie", label: "Calorie" },
];

/**
 * La scheda Impostazioni, richiesta come punto d'accesso unico e ordinato a tutte le
 * impostazioni dell'app — prima sparse tra Home (rilevamento posizione, backup, widget),
 * Finanze (ciclo del budget, suddivisione stipendio), Salute (obiettivi), Alimentazione
 * (obiettivi), Diario (anteprime video), News (fonti) e Tiber (la sua pagina dedicata),
 * raggiungibili solo scavando dentro ciascuna scheda. Qui sono tutte in un solo posto,
 * organizzate per argomento — non un elenco piatto, una GlassCard per argomento, la stessa
 * ricchezza grafica (bolle colorate, glow, gradienti) del resto dell'app invece di una lista
 * di test spoglia.
 *
 * Le impostazioni con un'interfaccia già ricca e collaudata altrove (obiettivi alimentari,
 * gestione fonti News, impostazioni di Tiber) non vengono duplicate qui pezzo per pezzo — si
 * aprono dal loro stesso modulo già esistente (un pulsante o un link), per restare la sola
 * fonte di verità di quella UI. Quelle invece senza una vera casa propria (rilevamento
 * posizione, ciclo del budget, obiettivi di peso e attività, backup) vivono qui per intero.
 *
 * Corretto secondo le istruzioni: niente più sezioni "Schede in barra"/"Tutte le schede" —
 * duplicavano da qui una gestione che vive già, per intero, sulla barra stessa (pressione
 * lunga su uno slot apre lo stesso `SlotPicker`, con l'intero catalogo `ALL_NAV_ITEMS` tra
 * cui scegliere — vedi BottomNav.tsx), un'unica fonte anche per questo invece di due punti
 * da tenere sincronizzati.
 */
export default function ImpostazioniPage() {
  const { placed: widgets, hydrated: widgetsHydrated } = useWidgets();
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const { hrefs: shortcutHrefs, hydrated: shortcutsHydrated, addShortcut, removeShortcut } = useShortcuts();

  const { hydrated: financeHydrated, cycleStartDay, setCycleStartDay, salarySplit, setSalarySplit } = useFinance();
  const [splitText, setSplitText] = useState<Record<SplitKey, string>>({
    speseFisse: String(salarySplit.speseFisse),
    tempoLibero: String(salarySplit.tempoLibero),
    risparmi: String(salarySplit.risparmi),
  });
  const splitTotal = SPLIT_FIELDS.reduce((s, f) => s + (parseInt(splitText[f.key], 10) || 0), 0);

  const { hydrated: healthHydrated, weightGoal, setWeightGoal, weeklyGoal, setWeeklyGoal } = useHealth();
  const [weightGoalText, setWeightGoalText] = useState(weightGoal !== null ? String(weightGoal) : "");
  const [weeklyType, setWeeklyType] = useState<WeeklyGoalType>(weeklyGoal?.type ?? "minuti");
  const [weeklyTargetText, setWeeklyTargetText] = useState(weeklyGoal ? String(weeklyGoal.target) : "");

  const { goals: foodGoals } = useFood();
  const [foodGoalsOpen, setFoodGoalsOpen] = useState(false);

  const { hydrated: diaryHydrated, scrubPreviewEnabled, setScrubPreviewEnabled } = useDiary();
  const { selectedIds: newsSelectedIds } = useNewsSources();
  const { hydrated: householdHydrated, trackingEnabled, setTrackingEnabled } = useHousehold();

  const [taskView, setTaskView] = usePersistedChoice<"elenco" | "calendario">("vitae:task-view", "elenco", ["elenco", "calendario"] as const);
  const [wishlistSort, setWishlistSort] = usePersistedChoice<WishlistSortMode>(
    "vitae:wishlist-sort",
    "recenti",
    ["recenti", "meno-recenti", "prezzo-asc", "prezzo-desc"] as const
  );
  const [notesSort, setNotesSort] = usePersistedChoice<"recenti" | "alfabetico">("vitae:liste-note-sort", "recenti", ["recenti", "alfabetico"] as const);
  const [mapSort, setMapSort] = usePersistedChoice<"rating-desc" | "rating-asc" | "visits-desc" | "visits-asc">(
    "vitae:map-sort",
    "rating-desc",
    ["rating-desc", "rating-asc", "visits-desc", "visits-asc"] as const
  );

  const allHydrated =
    widgetsHydrated && shortcutsHydrated && financeHydrated && healthHydrated && diaryHydrated && householdHydrated;
  if (!allHydrated) return null;

  const commitSplit = (key: SplitKey, text: string) => {
    setSplitText((prev) => ({ ...prev, [key]: text }));
    if (text === "" || !/^\d{1,3}$/.test(text)) return;
    const clamped = Math.max(0, Math.min(100, parseInt(text, 10)));
    setSalarySplit({ ...salarySplit, [key]: clamped });
  };

  const commitWeightGoal = (text: string) => {
    setWeightGoalText(text);
    if (text.trim() === "") {
      setWeightGoal(null);
      return;
    }
    const v = parseFloat(text.replace(",", "."));
    if (!Number.isNaN(v) && v > 0) setWeightGoal(v);
  };

  const commitWeeklyGoal = (type: WeeklyGoalType, targetText: string) => {
    setWeeklyType(type);
    setWeeklyTargetText(targetText);
    if (targetText.trim() === "") {
      setWeeklyGoal(null);
      return;
    }
    const v = parseInt(targetText, 10);
    if (Number.isFinite(v) && v > 0) setWeeklyGoal({ type, target: v } as WeeklyActivityGoal);
  };

  const foodGoalSummary = (() => {
    const parts: string[] = [];
    if (foodGoals.dailyKcalMin || foodGoals.dailyKcalMax) {
      parts.push(
        `${foodGoals.dailyKcalMin ?? "…"}–${foodGoals.dailyKcalMax ?? "…"} kcal/giorno`
      );
    }
    if (foodGoals.waterGoalLiters) parts.push(`${foodGoals.waterGoalLiters} L d'acqua`);
    if (foodGoals.macroSplitEnabled) parts.push("macro suddivisi");
    return parts.length > 0 ? parts.join(" · ") : "Nessun obiettivo impostato ancora";
  })();

  let delay = 0;
  const next = () => (delay += 0.025);

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <Reveal delay={next()}>
        <p className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-600">
          <SettingsIcon size={12} /> Impostazioni
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink-100">Tutto come vuoi tu</h1>
        <p className="mt-2 text-sm text-ink-600">
          Ogni impostazione dell&apos;app, in un solo posto — organizzata per argomento invece che sparsa tra le schede.
        </p>
      </Reveal>

      {/* Home */}
      <Reveal delay={next()} className="mt-7">
        <GlassCard className="p-5">
          <SectionHeader icon={LayoutDashboard} tone="emerald" title="Home" subtitle="Cosa compare nella tua schermata principale." />
          <Row
            label="Widget"
            hint={widgets.length === 0 ? "Nessuno ancora" : `${widgets.length} attivi`}
            control={
              <button
                onClick={() => setAddWidgetOpen(true)}
                className="focus-ring rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-aura-emerald/50"
              >
                Gestisci
              </button>
            }
          />
          <p className="mb-2 mt-4 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Scorciatoie</p>
          <div className="flex flex-wrap gap-1.5">
            {SHORTCUT_CATALOG.map((s) => {
              const Icon = s.icon;
              const active = shortcutHrefs.includes(s.href);
              return (
                <button
                  key={s.href}
                  onClick={() => (active ? removeShortcut(s.href) : addShortcut(s.href))}
                  className={`focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition ${
                    active ? "border-aura-emerald/50 bg-aura-emerald/10 text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  <Icon size={11} /> {s.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </Reveal>

      {/* Finanze */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={Wallet} tone="amber" title="Finanze" subtitle="Il ritmo del tuo budget e la suddivisione di default dello stipendio." />
          <p className="mb-2 text-xs text-ink-600">Giorno di inizio del ciclo di budget</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCycleStartDay(cycleStartDay - 1)}
              disabled={cycleStartDay <= 1}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 disabled:opacity-30 hover:border-aura-amber/50"
              aria-label="Giorno precedente"
            >
              −
            </button>
            <span className="w-12 text-center font-display text-lg text-ink-100">{cycleStartDay}</span>
            <button
              onClick={() => setCycleStartDay(cycleStartDay + 1)}
              disabled={cycleStartDay >= 28}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 disabled:opacity-30 hover:border-aura-amber/50"
              aria-label="Giorno successivo"
            >
              +
            </button>
            <p className="text-[11px] text-ink-800">del mese, invece del giorno 1 di calendario</p>
          </div>

          <p className="mb-2 mt-5 text-xs text-ink-600">Suddivisione stipendio di default (usata dal calcolatore in Finanze)</p>
          <div className="grid grid-cols-3 gap-2">
            {SPLIT_FIELDS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-ink-600">
                    <Icon size={11} style={{ color: f.color }} /> {f.label}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={splitText[f.key]}
                      onChange={(e) => commitSplit(f.key, e.target.value)}
                      className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 pr-5 text-sm text-ink-100"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-600">%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={`mt-2 text-[11px] ${splitTotal === 100 ? "text-ink-800" : "text-aura-pink"}`}>
            Totale: {splitTotal}%{splitTotal !== 100 && " — dovrebbe fare 100%"}
          </p>

          <Link
            href="/finanze"
            className="focus-ring mt-4 flex items-center gap-1 text-xs text-aura-cyan hover:underline"
          >
            Apri il calcolatore in Finanze <ChevronRight size={12} />
          </Link>
        </GlassCard>
      </Reveal>

      {/* Salute e Attività */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={HeartPulse} tone="pink" title="Salute e Attività" subtitle="I tuoi obiettivi personali di peso e attività settimanale." />
          <TextField
            label="Obiettivo di peso (kg)"
            inputMode="decimal"
            placeholder="Nessun obiettivo"
            value={weightGoalText}
            onChange={(e) => commitWeightGoal(e.target.value)}
          />

          <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs text-ink-600">
            <Dumbbell size={12} /> Obiettivo settimanale di attività
          </p>
          <div className="flex gap-1.5">
            {WEEKLY_GOAL_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => commitWeeklyGoal(t.id, weeklyTargetText)}
                className={`focus-ring flex-1 rounded-full border py-1.5 text-[11px] transition ${
                  weeklyType === t.id ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100" : "border-white/10 text-ink-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Nessun obiettivo"
            value={weeklyTargetText}
            onChange={(e) => commitWeeklyGoal(weeklyType, e.target.value)}
            className="focus-ring mt-2 w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-100 placeholder:text-ink-800"
          />
        </GlassCard>
      </Reveal>

      {/* Alimentazione */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={Utensils} tone="cyan" title="Alimentazione" subtitle="Calorie, acqua e macronutrienti." />
          <p className="mb-3 text-xs text-ink-600">{foodGoalSummary}</p>
          <Button variant="outline" size="sm" onClick={() => setFoodGoalsOpen(true)}>
            <Scale size={13} /> Apri obiettivi alimentari
          </Button>
        </GlassCard>
      </Reveal>

      {/* Diario */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={BookHeart} tone="violet" title="Diario" />
          <Row
            label="Anteprime video animate"
            hint="Le miniature dei video scorrono tra più fotogrammi invece di restare ferme."
            control={<Switch checked={scrubPreviewEnabled} onChange={setScrubPreviewEnabled} />}
          />
        </GlassCard>
      </Reveal>

      {/* News */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={Newspaper} tone="amber" title="News" subtitle="Le testate da cui ricevere notizie." />
          <Row
            label={newsSelectedIds.length === 0 ? "Nessuna fonte scelta" : `${newsSelectedIds.length} fonti selezionate`}
            control={
              <Link
                href="/news/fonti"
                className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-aura-amber/50"
              >
                Gestisci <ChevronRight size={12} />
              </Link>
            }
          />
        </GlassCard>
      </Reveal>

      {/* Famiglia e posizione */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={LocateFixed} tone="cyan" title="Famiglia e posizione" />
          <Row
            label="Rilevamento posizione"
            hint="Sapere quando arrivi a casa o in un luogo salvato — usato anche da Tiber, se glielo permetti nella sua scheda Accesso ai dati."
            control={<Switch checked={trackingEnabled} onChange={setTrackingEnabled} />}
          />
        </GlassCard>
      </Reveal>

      {/* Tiber */}
      <Reveal delay={next()} className="mt-4">
        <Link href="/tiber/impostazioni">
          <GlassCard className="p-5 transition hover:border-white/20">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                icon={Sparkles}
                tone="violet"
                title="Tiber"
                subtitle="Chiave Gemini, intromissioni spontanee, voce e accesso ai tuoi dati."
              />
              <ChevronRight size={16} className="shrink-0 text-ink-800" />
            </div>
          </GlassCard>
        </Link>
      </Reveal>

      {/* Viste predefinite */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader
            icon={ListFilter}
            tone="sky"
            title="Viste predefinite"
            subtitle="Le tue scelte di vista e ordinamento in queste schede vengono ricordate da sole — puoi comunque riportarle al punto di partenza da qui."
          />
          <div className="space-y-1.5">
            <Row
              label="Task"
              hint={taskView === "elenco" ? "Vista: Elenco" : "Vista: Calendario"}
              control={
                <button onClick={() => setTaskView("elenco")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Reimposta Task">
                  <RotateCcw size={14} />
                </button>
              }
            />
            <Row
              label="Wishlist"
              hint={`Ordine: ${WISHLIST_SORT_LABEL[wishlistSort]}`}
              control={
                <button onClick={() => setWishlistSort("recenti")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Reimposta Wishlist">
                  <RotateCcw size={14} />
                </button>
              }
            />
            <Row
              label="Liste e note"
              hint={notesSort === "recenti" ? "Ordine: Più recenti" : "Ordine: A-Z"}
              control={
                <button onClick={() => setNotesSort("recenti")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Reimposta Liste e note">
                  <RotateCcw size={14} />
                </button>
              }
            />
            <Row
              label="Mappa"
              hint={`Ordine: ${
                { "rating-desc": "Valutazione ↓", "rating-asc": "Valutazione ↑", "visits-desc": "Visite ↓", "visits-asc": "Visite ↑" }[mapSort]
              }`}
              control={
                <button onClick={() => setMapSort("rating-desc")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Reimposta Mappa">
                  <RotateCcw size={14} />
                </button>
              }
            />
          </div>
        </GlassCard>
      </Reveal>

      {/* Backup e dati */}
      <Reveal delay={next()} className="mt-4">
        <GlassCard className="p-5">
          <SectionHeader icon={ShieldCheck} tone="emerald" title="Backup e dati" subtitle="Tutto vive solo su questo dispositivo — esporta ogni tanto per non perdere nulla." />
          <BackupSection />
        </GlassCard>
      </Reveal>

      <p className="mt-8 text-center text-[11px] text-ink-800">Vitae · La tua vita, vissuta due volte.</p>

      {addWidgetOpen && <AddWidgetSheet onClose={() => setAddWidgetOpen(false)} />}
      {foodGoalsOpen && <FoodGoalsModal onClose={() => setFoodGoalsOpen(false)} />}
    </div>
  );
}
