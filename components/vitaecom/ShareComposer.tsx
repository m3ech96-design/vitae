"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useMood } from "@/lib/mood-context";
import { useProfile } from "@/lib/profile-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { chainRootOf } from "@/lib/vitaecom-lato-stato";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { AuraAvatar } from "../ui/AuraAvatar";
import { Switch } from "../ui/Switch";
import { MoodPicker } from "./MoodPicker";

/**
 * Il foglio "Condividi" — non più una sola riga generata da sola: scrivi cosa vuoi, scegli
 * "Cosa provi?" (obbligatorio: è quello che alimenta il Lato Stato), e — solo se il post che
 * stai condividendo aveva a sua volta una propria aggiunta scritta durante una condivisione
 * precedente — decidi se incorporare anche quella, oltre all'originale (che si incorpora
 * sempre, senza bisogno di un interruttore).
 */
export function ShareComposer({ post, onClose }: { post: VitaecomPost; onClose: () => void }) {
  const { posts, sharePost } = useVitaecomSocial();
  const { allMoods, activeMood, suggestMood } = useMood();
  const { profile } = useProfile();
  const [text, setText] = useState("");
  const [moodId, setMoodId] = useState<string | undefined>(activeMood?.moodId);
  const [includeSourceAddition, setIncludeSourceAddition] = useState(true);

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const chainRoot = chainRootOf(post);
  const rootPost = posts.find((p) => p.id === chainRoot) ?? post;
  const rootAccount = resolveAccount(rootPost.authorId, userAccount);
  const rootPhoto = useResolvedImage(rootPost.photoKey);
  const rootVideo = useResolvedVideo(rootPost.videoKey);

  // Un'aggiunta da offrire come extra c'è solo se il post che stai condividendo era esso
  // stesso una condivisione con un proprio testo — mai per l'originale, che si incorpora già
  // sempre per conto suo.
  const sourceHasOwnAddition = Boolean(post.sharedFromPostId) && Boolean(post.caption.trim());
  const sourceAccount = resolveAccount(post.authorId, userAccount);

  const mood = moodId ? allMoods.find((m) => m.id === moodId) : undefined;
  const moodColor = mood?.color ?? "#565B77";

  const submit = () => {
    if (!moodId) return;
    sharePost({ sourcePostId: post.id, caption: text.trim(), sharedMoodId: moodId, includeSourceAddition });
    suggestMood(moodId);
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
        className="glass-strong flex max-h-[88vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Condividi</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrivi qualcosa…"
            rows={3}
            className="focus-ring w-full resize-none rounded-xl2 border border-white/10 bg-white/[0.03] p-3.5 text-sm text-ink-100 placeholder:text-ink-800"
          />

          <div className="mt-4 flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-ink-200">Cosa provi?</span>
            <MoodPicker size={30} color={moodColor} onPick={setMoodId} label="Scegli cosa provi" />
          </div>
          {mood && (
            <p className="mt-1.5 text-right text-xs" style={{ color: mood.color }}>
              {mood.label}
            </p>
          )}

          {sourceHasOwnAddition && (
            <label className="mt-4 flex items-center justify-between gap-3 rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3">
              <span className="text-xs text-ink-200">Incorpora anche il contenuto aggiunto da {sourceAccount.nickname}</span>
              <Switch checked={includeSourceAddition} onChange={setIncludeSourceAddition} />
            </label>
          )}

          <p className="mb-2 mt-5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Incorporerai</p>
          <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <AuraAvatar imageUrl={rootAccount.avatarUrl} firstName={rootAccount.nickname} size={22} ring="idle" />
              <span className="text-xs text-ink-200">{rootAccount.nickname}</span>
            </div>
            {(rootPhoto || rootPost.demoPhotoUrl) && !rootVideo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rootPhoto || rootPost.demoPhotoUrl} alt="" className="mt-2 max-h-40 w-full rounded-lg object-cover" />
            )}
            {rootVideo && <video src={rootVideo} className="mt-2 max-h-40 w-full rounded-lg object-contain bg-black" muted />}
            {rootPost.caption && <p className="mt-1.5 line-clamp-3 text-xs text-ink-400">{rootPost.caption}</p>}
          </div>
          {includeSourceAddition && sourceHasOwnAddition && (
            <div className="mt-2.5 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <AuraAvatar imageUrl={sourceAccount.avatarUrl} firstName={sourceAccount.nickname} size={22} ring="idle" />
                <span className="text-xs text-ink-200">{sourceAccount.nickname}</span>
              </div>
              <p className="mt-1.5 line-clamp-3 text-xs text-ink-400">{post.caption}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!moodId}
            className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-aura-gradient py-3 text-sm font-display text-void-950 shadow-glow disabled:opacity-40"
          >
            <Send size={15} /> Condividi
          </button>
          {!moodId && <p className="mt-2 text-center text-[11px] text-ink-800">Scegli prima cosa provi.</p>}
        </div>
      </motion.div>
    </div>
  );
}
