"use client";
import { useMemo, useState } from "react";
import { Sparkles, Camera, Loader2 } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { useTasks } from "@/lib/tasks-context";
import { useProfile } from "@/lib/profile-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { VitaegramTag } from "@/lib/vitaegram-social-types";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { Button } from "../ui/Button";

const HOUR_MS = 3_600_000;

export function ImprimiMomento({ onClose }: { onClose: () => void }) {
  const { activeMood, allMoods } = useMood();
  const { tasks } = useTasks();
  const { profile } = useProfile();
  const { publish } = useVitaegramSocial();

  const currentMood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : undefined;
  const recentTasks = useMemo(
    () => tasks.filter((t) => t.completed && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < HOUR_MS),
    [tasks]
  );

  const [includeMood, setIncludeMood] = useState(Boolean(currentMood));
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [captionByAI, setCaptionByAI] = useState(false);
  const [photoKey, setPhotoKey] = useState<string | undefined>(undefined);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const toggleTask = (id: string) => setTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const askAI = async () => {
    setAiLoading(true);
    setAiError(null);
    const parts: string[] = [];
    if (includeMood && currentMood) parts.push(`Stato d'animo: ${currentMood.label}.`);
    recentTasks
      .filter((t) => taskIds.includes(t.id))
      .forEach((t) => parts.push(`Ha appena completato: ${t.title}.`));
    if (parts.length === 0) {
      setAiError("Seleziona Almeno Un Elemento Prima Di Chiedere All'IA.");
      setAiLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/vitaegram-caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: parts.join(" "), moodLabel: includeMood ? currentMood?.label : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Qualcosa È Andato Storto.");
      } else {
        setCaption(data.caption);
        setCaptionByAI(true);
      }
    } catch {
      setAiError("Impossibile Contattare Il Servizio.");
    } finally {
      setAiLoading(false);
    }
  };

  const canPublish = caption.trim().length > 0 || Boolean(photoKey);

  const submit = () => {
    if (!canPublish) return;
    const tags: VitaegramTag[] = taskIds.map((id) => ({ type: "task", id }));
    publish({ caption: caption.trim(), captionByAI, moodId: includeMood ? currentMood?.id : undefined, photoKey, tags });
    onClose();
  };

  return (
    <PersonalCardSheet title="Imprimi Momento" onClose={onClose}>
      <p className="text-xs text-ink-800">
        Ecco Cosa È Attivo Ora E Nell&apos;Ultima Ora — Scegli Tu Cosa Diventa Davvero Un Post.
      </p>

      {currentMood && (
        <button
          onClick={() => setIncludeMood((v) => !v)}
          className="focus-ring mt-4 flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition"
          style={
            includeMood
              ? { borderColor: `${currentMood.color}88`, background: `${currentMood.color}18`, color: "#F1F1FA" }
              : { borderColor: "rgba(255,255,255,0.1)", color: "#8B90A8" }
          }
        >
          Stato D&apos;Animo: {currentMood.label}
          <span className="h-2 w-2 rounded-full" style={{ background: currentMood.color }} />
        </button>
      )}

      {recentTasks.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-ink-800">Completate Nell&apos;Ultima Ora</p>
          <div className="flex flex-wrap gap-2">
            {recentTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="focus-ring rounded-full border px-3 py-1.5 text-xs transition"
                style={
                  taskIds.includes(t.id)
                    ? { borderColor: `${t.color}88`, background: `${t.color}18`, color: "#F1F1FA" }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "#8B90A8" }
                }
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-800">Didascalia</p>
          <button onClick={askAI} disabled={aiLoading} className="focus-ring flex items-center gap-1 text-xs text-aura-cyan disabled:opacity-40">
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Aiutami A Scrivere
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setCaptionByAI(false);
          }}
          rows={4}
          placeholder="Cosa Vuoi Raccontare Di Questo Momento?"
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-100 placeholder:text-ink-800"
        />
        {aiError && <p className="mt-1.5 text-xs text-aura-pink">{aiError}</p>}
      </div>

      <div className="mt-4">
        <ImageCropInput
          shape="square"
          onChange={(key) => setPhotoKey(key)}
          trigger={(open) => (
            <button
              onClick={open}
              className="focus-ring flex items-center gap-2 rounded-xl2 border border-dashed border-white/15 px-4 py-3 text-xs text-ink-600"
            >
              <Camera size={14} /> {photoKey ? "Cambia Foto" : "Aggiungi Una Tua Foto (Facoltativo)"}
            </button>
          )}
        />
      </div>

      <Button className="mt-6 w-full justify-center" onClick={submit} disabled={!canPublish}>
        Pubblica Su Vitaegram
      </Button>
    </PersonalCardSheet>
  );
}
