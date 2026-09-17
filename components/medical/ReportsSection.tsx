"use client";
import { useState } from "react";
import { Plus, X, FileText, Camera } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PhotoThumb } from "../ui/PhotoThumb";
import { PhotoLightbox } from "../ui/PhotoLightbox";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

const TYPES = ["Analisi", "Visita", "Imaging", "Altro"];

/** Anteprima larga (non un quadratino) per il referto in fase di compilazione/consultazione
 * — dove PhotoThumb va benissimo per un'icona di riga, qui la foto è il contenuto
 * principale della sezione e merita più spazio; resta comunque apribile a schermo intero. */
function WideReportPhoto({ photoKey, onClick }: { photoKey: string; onClick: () => void }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="mt-2 h-40 w-full animate-pulse rounded-lg bg-white/5" />;
  return (
    <button onClick={onClick} className="focus-ring mt-2 block w-full overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-h-40 w-full object-cover" />
    </button>
  );
}

export function ReportsSection() {
  const { reports, addReport, removeReport } = useMedical();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [date, setDate] = useState(todayIso());
  const [doctorOrLab, setDoctorOrLab] = useState("");
  const [notes, setNotes] = useState("");
  const [photoKey, setPhotoKey] = useState<string | undefined>();
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return;
    addReport({ title: title.trim(), type, date, doctorOrLab: doctorOrLab.trim() || undefined, notes: notes.trim() || undefined, photoKey });
    setTitle("");
    setType(TYPES[0]);
    setDate(todayIso());
    setDoctorOrLab("");
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
            {r.photoKey ? <PhotoThumb photoKey={r.photoKey} size="sm" /> : <FileText size={15} className="shrink-0 text-aura-cyan" />}
            <div>
              <p className="text-sm text-ink-100">{r.title}</p>
              <p className="text-[11px] text-ink-800">
                {r.type} · {formatDateShort(r.date)}
                {r.doctorOrLab ? ` · ${r.doctorOrLab}` : ""}
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
          <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Radiografia torace" autoFocus />
          <div className="flex gap-1.5">
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
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Medico/laboratorio" value={doctorOrLab} onChange={(e) => setDoctorOrLab(e.target.value)} />
          </div>
          <TextField label="Note (facoltativo)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {photoKey ? (
            <div className="relative">
              <WideReportPhoto photoKey={photoKey} onClick={() => setViewingPhoto(photoKey)} />
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
            {openReport.doctorOrLab ? ` · ${openReport.doctorOrLab}` : ""}
          </p>
          {openReport.notes && <p className="mt-2 text-sm text-ink-200">{openReport.notes}</p>}
          {openReport.photoKey && <WideReportPhoto photoKey={openReport.photoKey} onClick={() => setViewingPhoto(openReport.photoKey!)} />}
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

      {viewingPhoto && <PhotoLightbox photos={[viewingPhoto]} onClose={() => setViewingPhoto(null)} />}
    </div>
  );
}
