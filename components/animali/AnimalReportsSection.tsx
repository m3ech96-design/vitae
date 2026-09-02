"use client";
import { useState } from "react";
import { Plus, X, FileText, Camera } from "lucide-react";
import { useAnimalHealth, AnimalReport } from "@/lib/animal-health-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { ImageCropInput } from "../ui/ImageCropInput";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

const TYPES = ["Analisi", "Visita", "Intervento", "Altro"];

function ReportPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="mt-2 max-h-40 w-full rounded-lg object-cover" />;
}

export function AnimalReportsSection({ animalId, reports }: { animalId: string; reports: AnimalReport[] }) {
  const { addReport, removeReport } = useAnimalHealth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [photoKey, setPhotoKey] = useState<string | undefined>();
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return;
    addReport({ animalId, title: title.trim(), type, date, notes: notes.trim() || undefined, photoKey });
    setTitle("");
    setType(TYPES[0]);
    setDate(todayIso());
    setNotes("");
    setPhotoKey(undefined);
    setOpen(false);
  };

  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  const openReport = sorted.find((r) => r.id === openReportId);

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <button
          key={r.id}
          onClick={() => setOpenReportId(r.id)}
          className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:border-white/15"
        >
          <div className="flex items-center gap-2.5">
            <FileText size={15} className="shrink-0 text-aura-cyan" />
            <div>
              <p className="text-sm text-ink-100">{r.title}</p>
              <p className="text-[11px] text-ink-800">
                {r.type} · {formatDateShort(r.date)}
              </p>
            </div>
          </div>
        </button>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi referto
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Esame del sangue" autoFocus />
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                  type === t ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Note (facoltativo)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {photoKey ? (
            <div className="relative">
              <ReportPhoto photoKey={photoKey} />
              <button
                onClick={() => setPhotoKey(undefined)}
                className="focus-ring absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-void-950/80 text-ink-200"
                aria-label="Rimuovi foto"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <ImageCropInput
              shape="square"
              onChange={setPhotoKey}
              trigger={(openPicker) => (
                <button
                  onClick={openPicker}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-cyan/50 hover:text-ink-200"
                >
                  <Camera size={14} /> Aggiungi una foto del referto
                </button>
              )}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!title.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}

      {openReport && (
        <PersonalCardSheet title={openReport.title} onClose={() => setOpenReportId(null)}>
          <p className="text-xs text-ink-800">
            {openReport.type} · {formatDateShort(openReport.date)}
          </p>
          {openReport.notes && <p className="mt-2 text-sm text-ink-200">{openReport.notes}</p>}
          <ReportPhoto photoKey={openReport.photoKey} />
          <Button
            variant="danger"
            size="sm"
            className="mt-4 w-full justify-center"
            onClick={() => {
              removeReport(openReport.id);
              setOpenReportId(null);
            }}
          >
            Elimina referto
          </Button>
        </PersonalCardSheet>
      )}
    </div>
  );
}
