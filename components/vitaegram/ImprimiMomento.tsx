"use client";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Camera, Loader2, UserPlus } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { useTasks } from "@/lib/tasks-context";
import { useProfile } from "@/lib/profile-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { useVitaegramDraft } from "@/lib/vitaegram-draft-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaegram-demo-data";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { Button } from "../ui/Button";

const HOUR_MS = 3_600_000;

export function ImprimiMomento({ onClose }: { onClose: () => void }) {
  const { activeMood, allMoods } = useMood();
  const { tasks } = useTasks();
  const { profile } = useProfile();
  const { publish } = useVitaegramSocial();
  const { draft, setPostDraft, clearDraft } = useVitaegramDraft();
  const existing = draft?.kind === "post" ? draft : undefined;

  const currentMood = activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : undefined;
  const recentTasks = useMemo(
    () => tasks.filter((t) => t.completed && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < HOUR_MS),
    [tasks]
  );

  // Riprende una bozza lasciata a metà (vedi lib/vitaegram-draft-context.tsx) — solo alla
  // primissima apertura, non sovrascrive più nulla dopo.
  const [includeMood, setIncludeMood] = useState(existing?.includeMood ?? Boolean(currentMood));
  const [taskIds, setTaskIds] = useState<string[]>(existing?.taskIds ?? []);
  const [taggedAccountIds, setTaggedAccountIds] = useState<string[]>(existing?.taggedAccountIds ?? []);
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [captionByAI, setCaptionByAI] = useState(existing?.captionByAI ?? false);
  const [photoKey, setPhotoKey] = useState<string | undefined>(existing?.photoKey);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sincronizza continuamente la bozza — così se esci da Vitaegram con "Home" mentre stai
  // ancora scrivendo, quello che c'è in quel momento è già salvato, senza bisogno di un
  // salvataggio esplicito legato a un solo pulsante.
  useEffect(() => {
    if (!caption.trim() && !photoKey && taskIds.length === 0 && taggedAccountIds.length === 0) return;
    setPostDraft({ caption, captionByAI, includeMood, photoKey, taggedAccountIds, taskIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption, captionByAI, includeMood, photoKey, taggedAccountIds, taskIds]);

  const toggleTask = (id: string) => setTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleTag = (id: string) => setTaggedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
    publish({
      caption: caption.trim(),
      captionByAI,
      moodId: includeMood ? currentMood?.id : undefined,
      photoKey,
      tags: taggedAccountIds.map((accountId) => ({ accountId })),
    });
    clearDraft();
    onClose();
  };

  const discardAndClose = () => {
    clearDraft();
    onClose();
  };

  return (
    <PersonalCardSheet title="Imprimi Momento" onClose={discardAndClose}>
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

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-ink-800">
          <UserPlus size={12} /> Tagga Persone
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleTag(a.id)}
              className="focus-ring rounded-full border px-3 py-1.5 text-xs transition"
              style={
                taggedAccountIds.includes(a.id)
                  ? { borderColor: "rgba(183,154,107,0.7)", background: "rgba(183,154,107,0.16)", color: "#F1F1FA" }
                  : { borderColor: "rgba(255,255,255,0.1)", color: "#8B90A8" }
              }
            >
              {a.nickname}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-ink-800">
          Solo Account Dimostrativi Per Ora — Non Esiste Ancora Nessun Account Reale Da Taggare.
        </p>
      </div>

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
