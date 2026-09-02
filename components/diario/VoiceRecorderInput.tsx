"use client";
import { useRef, useState } from "react";
import { Mic, Square, Check, RotateCcw } from "lucide-react";
import { putAudio } from "@/lib/audio-store";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

type Phase = "idle" | "recording" | "reviewing" | "denied";

export function VoiceRecorderInput({ onSaved }: { onSaved: (key: string) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("reviewing");
        stopStream();
      };
      recorder.start();
      recorderRef.current = recorder;
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 200);
    } catch {
      setPhase("denied");
    }
  };

  const stop = () => {
    stopTimer();
    recorderRef.current?.stop();
  };

  const discard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    blobRef.current = null;
    setPreviewUrl(null);
    setPhase("idle");
  };

  const confirm = async () => {
    if (!blobRef.current) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const key = await putAudio(reader.result as string);
      onSaved(key);
      discard();
    };
    reader.readAsDataURL(blobRef.current);
  };

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={start}
        className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-aura-pink/50"
      >
        <Mic size={13} /> Nota vocale
      </button>
    );
  }

  if (phase === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-aura-pink">
        <span>Microfono non disponibile.</span>
        <button onClick={() => setPhase("idle")} className="focus-ring underline">
          Riprova
        </button>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-aura-pink/40 bg-aura-pink/[0.08] px-3 py-1.5">
        <span className="h-2 w-2 animate-pulseSoft rounded-full bg-aura-pink" />
        <span className="font-display text-xs text-ink-100">{formatElapsed(elapsed)}</span>
        <button onClick={stop} className="focus-ring text-ink-100" aria-label="Ferma registrazione">
          <Square size={13} />
        </button>
      </div>
    );
  }

  // reviewing
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
      {previewUrl && <audio controls src={previewUrl} className="h-7 w-32" />}
      <button onClick={discard} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Elimina e riprova">
        <RotateCcw size={14} />
      </button>
      <button onClick={confirm} className="focus-ring text-aura-emerald" aria-label="Usa questa registrazione">
        <Check size={14} />
      </button>
    </div>
  );
}
