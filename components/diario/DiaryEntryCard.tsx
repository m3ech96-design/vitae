"use client";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useDiary } from "@/lib/diary-context";
import { useMood } from "@/lib/mood-context";
import { DiaryEntry } from "@/lib/diary-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedAudio } from "@/lib/use-resolved-audio";
import { VideoThumb } from "./VideoThumb";
import { MediaLightbox } from "./MediaLightbox";
import { DiaryComposer } from "./DiaryComposer";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function ImageThumb({ imageKey, onClick }: { imageKey: string; onClick: () => void }) {
  const url = useResolvedImage(imageKey);
  if (!url) return null;
  return (
    <button onClick={onClick} className="aspect-square w-full overflow-hidden rounded-xl2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

function AudioNote({ audioKey }: { audioKey: string }) {
  const url = useResolvedAudio(audioKey);
  if (!url) return null;
  return <audio controls src={url} className="h-9 w-full" />;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-aura-amber/30 text-ink-100">{text.slice(idx, idx + query.length)}</mark>
      {highlightMatch(text.slice(idx + query.length), query)}
    </>
  );
}

export function DiaryEntryCard({ entry, highlightQuery }: { entry: DiaryEntry; highlightQuery?: string }) {
  const { removeEntry } = useDiary();
  const { allMoods } = useMood();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return <DiaryComposer date={entry.date} entry={entry} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  }

  const mood = entry.moodId ? allMoods.find((m) => m.id === entry.moodId) : undefined;
  const images = entry.media.filter((m) => m.type === "image");
  const videos = entry.media.filter((m) => m.type === "video");
  const audios = entry.media.filter((m) => m.type === "audio");
  const visualMedia = [...images, ...videos];

  return (
    <div className="rounded-xl3 border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-600">{entry.time}</span>
          {mood && (
            <span className="flex items-center gap-1 text-xs" style={{ color: mood.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: mood.color }} />
              {mood.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Modifica">
            <Pencil size={13} />
          </button>
          <button onClick={() => setConfirmDelete(true)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Elimina">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {entry.text && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
          {highlightQuery ? highlightMatch(entry.text, highlightQuery) : entry.text}
        </p>
      )}

      {visualMedia.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {visualMedia.map((m, i) =>
            m.type === "image" ? (
              <ImageThumb key={m.id} imageKey={m.key} onClick={() => setLightboxIndex(i)} />
            ) : (
              <VideoThumb key={m.id} videoKey={m.key} onClick={() => setLightboxIndex(i)} />
            )
          )}
        </div>
      )}

      {audios.length > 0 && (
        <div className="mt-3 space-y-2">
          {audios.map((a) => (
            <AudioNote key={a.id} audioKey={a.key} />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <MediaLightbox media={visualMedia[lightboxIndex]} onClose={() => setLightboxIndex(null)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa nota?"
          description="L'azione non si può annullare."
          onConfirm={() => {
            removeEntry(entry.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
