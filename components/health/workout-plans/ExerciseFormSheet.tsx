"use client";
import { useState } from "react";
import { Youtube, Video, ImageIcon, Trash2, Check } from "lucide-react";
import clsx from "clsx";
import { WorkoutPlanExercise, WorkoutPlanExerciseMediaType } from "@/lib/types";
import { isValidYoutubeUrl } from "@/lib/youtube";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { TextField, TextArea } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { VideoPickerInput } from "@/components/ui/VideoPickerInput";
import { ImagePickerInput } from "@/components/ui/ImagePickerInput";
import { ExerciseMediaPlayer } from "./ExerciseMediaPlayer";

const MEDIA_TABS: { id: WorkoutPlanExerciseMediaType; label: string; icon: typeof Youtube }[] = [
  { id: "youtube", label: "Link YouTube", icon: Youtube },
  { id: "video", label: "Video", icon: Video },
  { id: "image", label: "Immagine", icon: ImageIcon },
];

/**
 * Foglio di creazione/modifica di un esercizio dentro una tabella di "Schede allenamenti".
 * Il media è "o l'uno o l'altro" tra le tre schede in alto — cambiare scheda azzera il valore
 * scelto in precedenza, così non si può salvare un esercizio con un `mediaType` che non
 * corrisponde più a quello mostrato (bug facile da introdurre altrimenti: si sceglie un video
 * locale, poi si passa alla scheda YouTube senza scrivere nulla, e si salva ancora la chiave
 * del video come se fosse un URL).
 */
export function ExerciseFormSheet({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: WorkoutPlanExercise;
  onSave: (input: Omit<WorkoutPlanExercise, "id">) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [reps, setReps] = useState(initial?.reps ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [mediaType, setMediaType] = useState<WorkoutPlanExerciseMediaType | null>(initial?.mediaType ?? null);
  const [mediaValue, setMediaValue] = useState<string | undefined>(initial?.mediaValue);
  const [youtubeDraft, setYoutubeDraft] = useState(initial?.mediaType === "youtube" ? initial.mediaValue ?? "" : "");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  const pickTab = (tab: WorkoutPlanExerciseMediaType) => {
    if (tab === mediaType) return;
    setMediaType(tab);
    setMediaValue(undefined);
    setYoutubeDraft("");
    setYoutubeError(null);
  };

  const confirmYoutube = () => {
    if (!isValidYoutubeUrl(youtubeDraft)) {
      setYoutubeError("Non sembra un link YouTube valido.");
      return;
    }
    setMediaValue(youtubeDraft.trim());
    setYoutubeError(null);
  };

  const save = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      reps: reps.trim(),
      note: note.trim() || undefined,
      mediaType: mediaType ?? undefined,
      mediaValue: mediaType ? mediaValue : undefined,
    });
    onClose();
  };

  const previewExercise: WorkoutPlanExercise | null =
    mediaType && mediaValue ? { id: "preview", name, reps, mediaType, mediaValue } : null;

  return (
    <PersonalCardSheet title={initial ? "Modifica esercizio" : "Nuovo esercizio"} onClose={onClose}>
      <div className="space-y-4">
        <TextField label="Nome esercizio" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Es. Squat" />
        <TextField
          label="Ripetizioni"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Es. 4 x 10, o 3 serie al cedimento"
        />
        <TextArea label="Nota" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note libere sull'esecuzione" />

        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Video o immagine (facoltativo)</p>
          <div className="flex gap-1.5">
            {MEDIA_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => pickTab(id)}
                className={clsx(
                  "focus-ring flex flex-1 flex-col items-center gap-1 rounded-xl2 border px-2 py-2.5 text-center transition",
                  mediaType === id ? "border-aura-violet/60 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600 hover:border-white/20"
                )}
              >
                <Icon size={15} />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          {mediaType === "youtube" && (
            <div className="mt-3">
              <div className="flex gap-2">
                <TextField
                  value={youtubeDraft}
                  onChange={(e) => {
                    setYoutubeDraft(e.target.value);
                    setYoutubeError(null);
                  }}
                  placeholder="Incolla il link YouTube"
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={confirmYoutube}>
                  <Check size={14} />
                </Button>
              </div>
              {youtubeError && <p className="mt-1.5 text-xs text-aura-pink">{youtubeError}</p>}
            </div>
          )}

          {mediaType === "video" && !mediaValue && (
            <VideoPickerInput
              onChange={(key) => setMediaValue(key)}
              trigger={(openPicker) => (
                <button
                  onClick={openPicker}
                  className="focus-ring mt-3 flex w-full flex-col items-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-6 text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
                >
                  <Video size={18} />
                  <span className="text-xs">Scegli un video dal dispositivo</span>
                </button>
              )}
            />
          )}

          {mediaType === "image" && !mediaValue && (
            <ImagePickerInput
              onChange={(key) => setMediaValue(key)}
              trigger={(openPicker) => (
                <button
                  onClick={openPicker}
                  className="focus-ring mt-3 flex w-full flex-col items-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-6 text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
                >
                  <ImageIcon size={18} />
                  <span className="text-xs">Scegli un'immagine dal dispositivo</span>
                </button>
              )}
            />
          )}

          {previewExercise && (
            <div className="mt-3">
              <ExerciseMediaPlayer exercise={previewExercise} />
              <button
                onClick={() => setMediaValue(undefined)}
                className="focus-ring mt-2 flex items-center gap-1.5 text-xs text-ink-600 hover:text-aura-pink"
              >
                <Trash2 size={12} /> Rimuovi media
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={13} />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={onClose}>
            Annulla
          </Button>
          <Button size="sm" className="flex-1 justify-center" onClick={save} disabled={!canSave}>
            Salva
          </Button>
        </div>
      </div>
    </PersonalCardSheet>
  );
}
