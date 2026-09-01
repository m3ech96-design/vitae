"use client";
import { useMemo, useState } from "react";
import {
  FileText,
  CalendarClock,
  TestTube2,
  Activity,
  Pill,
  ClipboardList,
  AlertTriangle,
  Syringe,
  Phone,
  Stethoscope,
} from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { ReportsSection } from "@/components/medical/ReportsSection";
import { AppointmentsSection } from "@/components/medical/AppointmentsSection";
import { BloodTestsSection } from "@/components/medical/BloodTestsSection";
import { VitalsSection } from "@/components/medical/VitalsSection";
import { MedicationsSection } from "@/components/medical/MedicationsSection";
import { AnamnesisSection } from "@/components/medical/AnamnesisSection";
import { AllergiesSection } from "@/components/medical/AllergiesSection";
import { VaccinationsSection } from "@/components/medical/VaccinationsSection";
import { ContactsSection } from "@/components/medical/ContactsSection";
import { SymptomsSection } from "@/components/medical/SymptomsSection";

type SectionId =
  | "referti"
  | "appuntamenti"
  | "analisi"
  | "vitali"
  | "farmaci"
  | "anamnesi"
  | "allergie"
  | "vaccinazioni"
  | "contatti"
  | "sintomi";

export default function SaluteMedicaPage() {
  const { hydrated, appointments, medications, allergies, vaccinations } = useMedical();
  const [open, setOpen] = useState<SectionId | null>(null);

  const nowIso = new Date().toISOString();
  const upcomingCount = useMemo(() => appointments.filter((a) => !a.completed && a.date >= nowIso).length, [appointments, nowIso]);
  const activeMedsCount = useMemo(() => medications.filter((m) => !m.endDate).length, [medications]);
  const severeAllergiesCount = useMemo(() => allergies.filter((a) => a.severity === "grave").length, [allergies]);
  const today = nowIso.slice(0, 10);
  const dueVaccineCount = useMemo(() => vaccinations.filter((v) => v.nextDueDate && v.nextDueDate <= today).length, [vaccinations, today]);

  const cards: { id: SectionId; label: string; icon: typeof FileText; color: string; note?: string }[] = [
    { id: "appuntamenti", label: "Appuntamenti", icon: CalendarClock, color: "#7C5CFF", note: upcomingCount > 0 ? `${upcomingCount} in arrivo` : undefined },
    { id: "referti", label: "Referti medici", icon: FileText, color: "#00E5C7" },
    { id: "analisi", label: "Analisi del sangue", icon: TestTube2, color: "#FFB454" },
    { id: "vitali", label: "Parametri vitali", icon: Activity, color: "#FF6B9D" },
    { id: "farmaci", label: "Farmaci", icon: Pill, color: "#B7A6FF", note: activeMedsCount > 0 ? `${activeMedsCount} in corso` : undefined },
    { id: "anamnesi", label: "Anamnesi", icon: ClipboardList, color: "#5EC8FF" },
    {
      id: "allergie",
      label: "Allergie e intolleranze",
      icon: AlertTriangle,
      color: "#FF4D6D",
      note: severeAllergiesCount > 0 ? `${severeAllergiesCount} gravi` : undefined,
    },
    { id: "vaccinazioni", label: "Vaccinazioni", icon: Syringe, color: "#34D399", note: dueVaccineCount > 0 ? "Richiamo in scadenza" : undefined },
    { id: "contatti", label: "Contatti medici", icon: Phone, color: "#8FD8FF" },
    { id: "sintomi", label: "Cronologia sintomi", icon: Stethoscope, color: "#8B90A8" },
  ];

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Salute</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Tutto ciò che riguarda la tua salute</h1>
      <p className="mt-2 text-sm text-ink-600">
        Allenamenti e peso hanno una loro scheda a parte — questa è la parte medica: referti,
        appuntamenti, farmaci, e tutto il resto.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {cards.map(({ id, label, icon: Icon, color, note }) => (
          <button key={id} onClick={() => setOpen(id)} className="text-left">
            <GlassCard className="p-4 transition hover:border-white/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}1f` }}>
                <Icon size={18} style={{ color }} />
              </span>
              <p className="mt-3 font-display text-sm text-ink-100">{label}</p>
              {note && (
                <p className="mt-0.5 text-[11px]" style={{ color }}>
                  {note}
                </p>
              )}
            </GlassCard>
          </button>
        ))}
      </div>

      {open === "referti" && (
        <PersonalCardSheet title="Referti medici" onClose={() => setOpen(null)}>
          <ReportsSection />
        </PersonalCardSheet>
      )}
      {open === "appuntamenti" && (
        <PersonalCardSheet title="Appuntamenti" onClose={() => setOpen(null)}>
          <AppointmentsSection />
        </PersonalCardSheet>
      )}
      {open === "analisi" && (
        <PersonalCardSheet title="Analisi del sangue" onClose={() => setOpen(null)}>
          <BloodTestsSection />
        </PersonalCardSheet>
      )}
      {open === "vitali" && (
        <PersonalCardSheet title="Parametri vitali" onClose={() => setOpen(null)}>
          <VitalsSection />
        </PersonalCardSheet>
      )}
      {open === "farmaci" && (
        <PersonalCardSheet title="Farmaci" onClose={() => setOpen(null)}>
          <MedicationsSection />
        </PersonalCardSheet>
      )}
      {open === "anamnesi" && (
        <PersonalCardSheet title="Anamnesi" onClose={() => setOpen(null)}>
          <AnamnesisSection />
        </PersonalCardSheet>
      )}
      {open === "allergie" && (
        <PersonalCardSheet title="Allergie e intolleranze" onClose={() => setOpen(null)}>
          <AllergiesSection />
        </PersonalCardSheet>
      )}
      {open === "vaccinazioni" && (
        <PersonalCardSheet title="Vaccinazioni" onClose={() => setOpen(null)}>
          <VaccinationsSection />
        </PersonalCardSheet>
      )}
      {open === "contatti" && (
        <PersonalCardSheet title="Contatti medici" onClose={() => setOpen(null)}>
          <ContactsSection />
        </PersonalCardSheet>
      )}
      {open === "sintomi" && (
        <PersonalCardSheet title="Cronologia sintomi" onClose={() => setOpen(null)}>
          <SymptomsSection />
        </PersonalCardSheet>
      )}
    </div>
  );
}
