"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Camera, Video, X } from "lucide-react";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { ImageCropInput } from "../ui/ImageCropInput";
import { VideoPickerInput } from "../ui/VideoPickerInput";

/**
 * La barra di navigazione "online", capovolta: entrando in una conversazione (vedi
 * NavSwitcher, che sceglie questa al posto di OnlineNav quando il percorso è una chat
 * precisa, non l'elenco) prende il suo stesso posto e la stessa animazione di comparsa
 * (`rotateY`, lo stesso `key`-swap già usato per il cambio online/offline) — una barra di
 * testo al posto delle schede, non un'altra finestra sopra di lei. La freccia all'estrema
 * sinistra è "una barra di navigazione o una semplice freccia per tornare indietro": qui la
 * seconda, più chiara — cliccarla torna semplicemente alla scheda Chat (l'elenco), il che
 * fa scattare da solo il capovolgimento inverso perché NavSwitcher sceglie la barra giusta
 * in base al percorso, non a uno stato suo da invertire a mano.
 */
export function ChatInputBar({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { sendMessage } = useVitaecomChat();
  const keyboardInset = useKeyboardInset();
  const [text, setText] = useState("");
  const [photoKey, setPhotoKey] = useState<string | undefined>();
  const [videoKey, setVideoKey] = useState<string | undefined>();
  const photoPreview = useResolvedImage(photoKey);
  const videoPreview = useResolvedVideo(videoKey);

  const submit = () => {
    if (!text.trim() && !photoKey && !videoKey) return;
    sendMessage(accountId, text, { photoKey, videoKey });
    setText("");
    setPhotoKey(undefined);
    setVideoKey(undefined);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: Math.max(14, keyboardInset + 10) }}
    >
      <motion.div
        key="chat-pill"
        initial={{ opacity: 0, rotateY: -100 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: 100 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 700 }}
        className="glass-nav flex w-full max-w-xl flex-col gap-2 rounded-[26px] px-2 py-2 shadow-glass"
      >
        {(photoPreview || videoPreview) && (
          <div className="relative ml-1 mt-1 w-fit">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-14 w-14 rounded-lg object-cover" />
            )}
            {videoPreview && <video src={videoPreview} className="h-14 w-14 rounded-lg object-cover" muted />}
            <button
              onClick={() => {
                setPhotoKey(undefined);
                setVideoKey(undefined);
              }}
              className="focus-ring absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-void-950 text-ink-300"
              aria-label="Rimuovi l'allegato"
            >
              <X size={11} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/vitaecom/chat")}
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-300 hover:text-ink-100"
            aria-label="Torna alla barra di navigazione"
          >
            <ArrowLeft size={18} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Scrivi un messaggio…"
            className="focus-ring min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink-100 placeholder:text-ink-800"
          />
          {!videoKey && (
            <ImageCropInput
              shape="square"
              onChange={setPhotoKey}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:text-ink-200"
                  aria-label="Aggiungi una foto"
                >
                  <Camera size={17} />
                </button>
              )}
            />
          )}
          {!photoKey && (
            <VideoPickerInput
              onChange={setVideoKey}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:text-ink-200"
                  aria-label="Aggiungi un video"
                >
                  <Video size={17} />
                </button>
              )}
            />
          )}
          <button
            onClick={submit}
            disabled={!text.trim() && !photoKey && !videoKey}
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B79A6B]/20 text-[#B79A6B] transition disabled:opacity-40"
            aria-label="Invia"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
