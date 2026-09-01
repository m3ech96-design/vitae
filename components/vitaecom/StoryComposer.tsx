"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Camera, Video } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useMood } from "@/lib/mood-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { ImageCropInput } from "../ui/ImageCropInput";
import { VideoPickerInput } from "../ui/VideoPickerInput";
import { MoodPicker } from "./MoodPicker";

/**
 * Una storia si compone come un "Imprimi Momento" più leggero — foto o video (mutuamente
 * esclusivi, stesso formato) più una didascalia facoltativa e uno stato d'animo facoltativo
 * — pubblicata subito, scompare da sola dopo 24 ore. Senza foto né video resta comunque
 * una storia valida: il visualizzatore la mostra come testo su fondo del colore dello stato
 * d'animo, non una card vuota.
 */
export function StoryComposer({ onClose }: { onClose: () => void }) {
  const { publishStory } = useVitaecomSocial();
  const { activeMood } = useMood();
  const [caption, setCaption] = useState("");
  const [moodId, setMoodId] = useState<string | undefined>(activeMood?.moodId);
  const [photoKey, setPhotoKey] = useState<string | undefined>();
  const [videoKey, setVideoKey] = useState<string | undefined>();
  const photoPreview = useResolvedImage(photoKey);
  const videoPreview = useResolvedVideo(videoKey);
  const { allMoods } = useMood();
  const moodColor = allMoods.find((m) => m.id === moodId)?.color ?? "#565B77";

  const canPublish = caption.trim().length > 0 || Boolean(photoKey) || Boolean(videoKey);

  const submit = () => {
    if (!canPublish) return;
    publishStory({ caption: caption.trim(), moodId, photoKey, videoKey, tags: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Nuova storia</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {(photoPreview || videoPreview) && (
            <div className="relative mb-3 aspect-[9/16] max-h-64 overflow-hidden rounded-xl2 bg-black">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              )}
              {videoPreview && <video src={videoPreview} className="h-full w-full object-cover" muted />}
            </div>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Scrivi qualcosa…"
            rows={2}
            className="focus-ring w-full resize-none rounded-xl2 border border-white/10 bg-white/[0.03] p-3.5 text-sm text-ink-100 placeholder:text-ink-800"
          />

          <div className="mt-3 flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-ink-200">Cosa provi? (facoltativo)</span>
            <MoodPicker size={26} color={moodColor} onPick={setMoodId} label="Scegli cosa provi" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            {!videoKey && (
              <ImageCropInput
                shape="square"
                onChange={setPhotoKey}
                trigger={(open) => (
                  <button onClick={open} className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-500 hover:text-ink-200" aria-label="Aggiungi una foto">
                    <Camera size={17} />
                  </button>
                )}
              />
            )}
            {!photoKey && (
              <VideoPickerInput
                onChange={setVideoKey}
                trigger={(open) => (
                  <button onClick={open} className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-500 hover:text-ink-200" aria-label="Aggiungi un video">
                    <Video size={17} />
                  </button>
                )}
              />
            )}
          </div>

          <button
            onClick={submit}
            disabled={!canPublish}
            className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-aura-gradient py-3 text-sm font-display text-void-950 shadow-glow disabled:opacity-40"
          >
            <Send size={15} /> Pubblica storia
          </button>
        </div>
      </motion.div>
    </div>
  );
}
