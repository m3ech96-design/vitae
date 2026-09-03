"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";

/**
 * Stessa meccanica di ChatInputBar (vedi lì per la nota completa sul capovolgimento), ma
 * per una chat di gruppo: solo testo, niente foto/video — coerente con la scelta di non
 * inventare un'attività dimostrativa multi-account (vedi la nota su VitaecomGroupMessage).
 */
export function GroupChatInputBar({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { sendGroupMessage } = useVitaecomChat();
  const keyboardInset = useKeyboardInset();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    sendGroupMessage(groupId, text);
    setText("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4" style={{ paddingBottom: Math.max(14, keyboardInset + 10) }}>
      <motion.div
        key="group-chat-pill"
        initial={{ opacity: 0, rotateY: -100 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: 100 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 700 }}
        className="glass-nav flex w-full max-w-xl items-center gap-1 rounded-[26px] px-2 py-2 shadow-glass"
      >
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
          placeholder="Scrivi al gruppo…"
          className="focus-ring min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink-100 placeholder:text-ink-800"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B79A6B]/20 text-[#B79A6B] transition disabled:opacity-40"
          aria-label="Invia"
        >
          <Send size={16} />
        </button>
      </motion.div>
    </div>
  );
}
