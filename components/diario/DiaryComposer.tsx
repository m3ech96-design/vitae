"use client";
import { useState } from "react";
import { ImagePlus, Video, X, Send } from "lucide-react";
import { useDiary } from "@/lib/diary-context";
import { useMood } from "@/lib/mood-context";
import { DiaryEntry, DiaryMedia } from "@/lib/diary-types";
import { newId } from "@/lib/id";
import { todayIso } from "@/lib/date-format";
import { TextArea } from "../ui/TextField";
import { ImageCropInput } from "../ui/ImageCropInput";
import { VideoPickerInput } from "../ui/VideoPickerInput";
import { VoiceRecorderInput } from "./VoiceRecorderInput";
import { MoodPicker } from "../vitaecom/MoodPicker";
import { useResolvedImage } from "@/lib/use-resolved-image";

function PendingThumb({ media, onRemove }: { media: DiaryMedia; onRemove: () => void }) {
  const imgUrl = useResolvedImage(media.type === "image" ? media.key : undefined);
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]">
      {media.type === "image" && imgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
      )}
      {media.type === "video" && (
        <div className="flex h-full w-full items-center justify-center text-ink-600">
          <Video size={18} />
        </div>
      )}
      {media.type === "audio" && (
        <div className="flex h-full w-full items-center justify-center text-ink-600">🎙️</div>
      )}
      <button
        onClick={onRemove}
        className="focus-ring absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-void-950/80 text-ink-100"
        aria-label="Rimuovi"
      >
        <X size={10} />
      </button>
    </div>
  );
}

export function DiaryComposer({
  date,
  entry,
  onDone,
  onCancel,
}: {
  date: string;
  /** Se presente, il composer modifica questa nota invece di crearne una nuova — stessa UI,
   * niente da duplicare. */
  entry?: DiaryEntry;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const { addEntry, updateEntry } = useDiary();
  const { allMoods, activeMood } = useMood();
  const [text, setText] = useState(entry?.text ?? "");
  const [media, setMedia] = useState<DiaryMedia[]>(entry?.media ?? []);
  const [moodId, setMoodId] = useState<string | undefined>(
    entry ? entry.moodId : date === todayIso() ? activeMood?.moodId : undefined
  );

  const mood = moodId ? allMoods.find((m) => m.id === moodId) : undefined;
  const canSave = text.trim().length > 0 || media.length > 0;

  const addMedia = (type: DiaryMedia["type"], key: string) => setMedia((prev) => [...prev, { id: newId(), type, key }]);
  const removeMedia = (id: string) => setMedia((prev) => prev.filter((m) => m.id !== id));

  const submit = () => {
    if (!canSave) return;
    if (entry) {
      updateEntry(entry.id, { text: text.trim(), media, moodId });
      onDone?.();
      return;
    }
    const now = new Date();
    addEntry({
      date,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      text: text.trim(),
      media,
      moodId,
    });
    setText("");
    setMedia([]);
  };

  return (
    <div className="rounded-xl3 border border-white/[0.06] bg-white/[0.015] p-4">
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cosa vuoi ricordare di oggi?"
        className="min-h-[80px]"
      />

      {media.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {media.map((m) => (
            <PendingThumb key={m.id} media={m} onRemove={() => removeMedia(m.id)} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ImageCropInput
          shape="square"
          onChange={(key) => addMedia("image", key)}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-aura-cyan/50"
            >
              <ImagePlus size={13} /> Immagine
            </button>
          )}
        />
        <VideoPickerInput
          onChange={(key) => addMedia("video", key)}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-aura-violet/50"
            >
              <Video size={13} /> Video
            </button>
          )}
        />
        <VoiceRecorderInput onSaved={(key) => addMedia("audio", key)} />

        <div className="ml-auto flex items-center gap-1.5">
          <MoodPicker size={26} color={mood?.color ?? "#565B77"} onPick={setMoodId} label="Stato d'animo di questo momento" />
          {mood && (
            <button onClick={() => setMoodId(undefined)} className="focus-ring text-[11px] text-ink-600 hover:text-ink-200">
              {mood.label} <X size={10} className="inline" />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!canSave}
        className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-aura-gradient py-2.5 text-sm font-display text-void-950 shadow-glow disabled:opacity-40"
      >
        <Send size={14} /> {entry ? "Salva modifiche" : "Scrivi nel diario"}
      </button>
      {entry && onCancel && (
        <button onClick={onCancel} className="focus-ring mt-2 w-full text-center text-xs text-ink-600 hover:text-ink-200">
          Annulla
        </button>
      )}
    </div>
  );
}
