"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat, VitaecomChatMessage } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { ReactionAvatarBurst } from "@/components/vitaecom/ReactionAvatarBurst";
import { MessageReaction } from "@/components/vitaecom/MessageReaction";
import { ChatOptionsSheet } from "@/components/vitaecom/ChatOptionsSheet";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

/** Una bolla con l'eventuale foto/video allegato — mai entrambi, mai per un messaggio demo
 * (i messaggi dell'altra parte sono sempre testo, vedi vitaecom-chat-context.tsx). */
function MessageMedia({ photoKey, videoKey }: { photoKey?: string; videoKey?: string }) {
  const photoUrl = useResolvedImage(photoKey);
  const videoUrl = useResolvedVideo(videoKey);
  if (!photoUrl && !videoUrl) return null;
  return (
    <div className="mb-1.5 overflow-hidden rounded-lg">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="max-h-56 w-full object-cover" />
      )}
      {videoUrl && <video src={videoUrl} controls playsInline preload="metadata" className="max-h-56 w-full bg-black object-contain" />}
    </div>
  );
}

/**
 * Una bolla con reazione — il contorno prende il colore dello stato d'animo di chi ha
 * reagito; se hanno reagito entrambi con stati diversi, il contorno diventa un gradiente
 * dei due colori con lo stesso effetto liquido già usato per il Lato Stato dei post (stessa
 * classe `.lato-stato-line`), non un secondo linguaggio visivo da inventare apposta.
 */
function MessageBubble({ message, onReact }: { message: VitaecomChatMessage; onReact: (moodId: string) => void }) {
  const { allMoods } = useMood();
  const userMood = message.userReactionMoodId ? allMoods.find((m) => m.id === message.userReactionMoodId) : undefined;
  const otherMood = message.otherReactionMoodId ? allMoods.find((m) => m.id === message.otherReactionMoodId) : undefined;
  const bg = message.fromUser ? "bg-[#B79A6B]/20 text-ink-100" : "border border-white/10 bg-white/[0.03] text-ink-200";

  const content = (
    <div className={`max-w-[75%] rounded-xl2 px-3.5 py-2.5 text-sm ${bg}`} style={userMood && !otherMood ? { borderColor: userMood.color, borderWidth: 1.5 } : otherMood && !userMood ? { borderColor: otherMood.color, borderWidth: 1.5 } : undefined}>
      <MessageMedia photoKey={message.photoKey} videoKey={message.videoKey} />
      {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
      <p className="mt-1 text-[10px] text-ink-800">{timeOf(message.createdAt)}</p>
      <MessageReaction userReactionMoodId={message.userReactionMoodId} otherReactionMoodId={message.otherReactionMoodId} onReact={onReact} />
    </div>
  );

  if (userMood && otherMood) {
    return (
      <div className={`flex ${message.fromUser ? "justify-end" : "justify-start"}`}>
        <div className="lato-stato-line max-w-[75%] rounded-xl2 p-[1.5px]" style={{ background: `linear-gradient(120deg, ${userMood.color}, ${otherMood.color}, ${userMood.color})` }}>
          <div className={`rounded-[inherit] px-3.5 py-2.5 text-sm ${message.fromUser ? "bg-[#0F1220]" : "bg-[#0F1220]"} ${message.fromUser ? "text-ink-100" : "text-ink-200"}`}>
            <MessageMedia photoKey={message.photoKey} videoKey={message.videoKey} />
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
            <p className="mt-1 text-[10px] text-ink-800">{timeOf(message.createdAt)}</p>
            <MessageReaction userReactionMoodId={message.userReactionMoodId} otherReactionMoodId={message.otherReactionMoodId} onReact={onReact} />
          </div>
        </div>
      </div>
    );
  }

  return <div className={`flex ${message.fromUser ? "justify-end" : "justify-start"}`}>{content}</div>;
}

/**
 * La barra di testo per scrivere qui non vive più in questa pagina: è diventata la barra di
 * navigazione "online" capovolta (vedi NavSwitcher e ChatInputBar) — questa pagina mostra
 * solo la conversazione, con un padding in fondo che le lascia lo spazio.
 */
function ChatThread({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { knownAccountIds, hydrated: socialHydrated } = useVitaecomSocial();
  const { allMoods } = useMood();
  const { hydrated: chatHydrated, messagesWith, setMessageReaction, reactionPing } = useVitaecomChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const hydrated = profileHydrated && socialHydrated && chatHydrated;
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(accountId, userAccount);
  const known = knownAccountIds.includes(accountId);
  const thread = messagesWith(accountId);
  const ping = reactionPing[accountId];
  const pingMoodColor = ping ? allMoods.find((m) => m.id === ping.moodId)?.color ?? "#8B90A8" : "#8B90A8";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col pb-32">
      <div className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-white/[0.05] bg-void-950/90 px-5 pb-3 pt-[max(env(safe-area-inset-top),1.1rem)] backdrop-blur-md sm:px-6">
        <ReactionAvatarBurst
          onBack={() => router.back()}
          onAvatarClick={() => setOptionsOpen(true)}
          avatarUrl={account.avatarUrl}
          nickname={account.nickname}
          triggerAt={ping?.at ?? null}
          moodColor={pingMoodColor}
        />
        <p className="font-display text-base text-ink-100">@{account.nickname}</p>
      </div>

      <div className="px-5 sm:px-6">
        {!known ? (
          <p className="mt-10 text-center text-sm text-ink-800">
            Conosci prima @{account.nickname} per poterle scrivere — vai al suo profilo e tocca &quot;Inizia a
            conoscere&quot;.
          </p>
        ) : (
          <div className="mt-6 flex-1 space-y-3 pb-4">
            {thread.length === 0 && (
              <p className="mt-10 text-center text-sm text-ink-800">Scrivi il primo messaggio a @{account.nickname}.</p>
            )}
            {thread.map((m) => (
              <MessageBubble key={m.id} message={m} onReact={(moodId) => setMessageReaction(m.id, moodId)} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {optionsOpen && <ChatOptionsSheet thread={thread} nickname={account.nickname} onClose={() => setOptionsOpen(false)} />}
    </div>
  );
}

export default function ChatThreadPage({ params }: { params: { accountId: string } }) {
  return (
    <NicknameGate>
      <ChatThread accountId={params.accountId} />
    </NicknameGate>
  );
}
