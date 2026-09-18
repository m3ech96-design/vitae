"use client";
import { useCallback, useRef, useState } from "react";

export type VoiceRecorderPhase = "idle" | "recording" | "denied";

/**
 * Registrazione "tieni premuto" per parlare con Tiber — stessa base tecnica di
 * components/diario/VoiceRecorderInput.tsx (MediaRecorder → Blob), ma un uso diverso: lì la
 * nota vocale viene salvata e riascoltata in loco, qui va spedita subito a Gemini e scompare
 * (vedi TiberMessage.voice in types.ts) — nessuna fase di "riascolta prima di confermare",
 * l'invio parte al rilascio del pulsante. Estratto qui come hook a parte (non duplicato)
 * perché sia la bolla flottante sia la chat normale ne hanno bisogno, con la stessa identica
 * logica di permesso/registrazione/interruzione.
 *
 * Il permesso del microfono lo gestisce il browser da solo: la primissima getUserMedia lo
 * chiede, quelle successive lo trovano già concesso per questa origine — non c'è nulla da
 * fare qui apposta, basta non cambiare i constraints da una chiamata all'altra (sempre
 * `{ audio: true }`, mai diverso) perché resti la stessa richiesta agli occhi del browser.
 */
export function useVoiceRecorder(onRecorded: (blob: Blob, mimeType: string) => void) {
  const [phase, setPhase] = useState<VoiceRecorderPhase>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // Tenuto fresco tramite ref, stesso motivo del pattern già usato in lib/tiber/context.tsx:
  // il gestore onstop di MediaRecorder è registrato una volta sola alla creazione, non deve
  // richiudere su una versione vecchia del callback se il chiamante lo ricrea a ogni render.
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    // Una pressione che arriva mentre una registrazione è già in corso (doppio tocco, evento
    // duplicato) va ignorata invece di aprire un secondo stream — MediaRecorder non permette
    // comunque due registrazioni sullo stesso stream, ma è più pulito non tentarci nemmeno.
    if (recorderRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stopStream();
        recorderRef.current = null;
        setPhase("idle");
        // Una pressione brevissima (o annullata subito) può produrre un blob vuoto — niente
        // da mandare a Gemini in quel caso, non ha senso una richiesta per zero audio.
        if (blob.size > 0) onRecordedRef.current(blob, mimeType);
      };
      recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
    } catch {
      // Permesso negato, microfono assente, o API non disponibile — stessa gestione già
      // collaudata in VoiceRecorderInput.tsx: un solo stato "denied", niente distinzione fine
      // tra le cause (l'utente non può comunque fare nulla di diverso in base al motivo).
      setPhase("denied");
    }
  }, [stopStream]);

  /** Ferma la registrazione e la invia (tramite onstop, sopra) — chiamata al rilascio normale
   * del pulsante. */
  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  /** Ferma la registrazione ma SCARTA il risultato — mai chiamata dal rilascio normale del
   * pulsante, solo per un annullamento esplicito (non usata nell'interfaccia attuale, tenuta
   * pronta per coerenza col resto dell'hook: fermare senza inviare è un'operazione diversa da
   * fermare e inviare, non va confusa riusando `stop` con un flag). */
  const cancel = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.onstop = null;
      if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
    }
    stopStream();
    recorderRef.current = null;
    setPhase("idle");
  }, [stopStream]);

  return { phase, start, stop, cancel };
}
