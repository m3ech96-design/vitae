"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

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
 * La barra di testo per scrivere qui non vive più in questa pagina: è diventata la barra di
 * navigazione "online" capovolta (vedi NavSwitcher e ChatInputBar) — questa pagina mostra
 * solo la conversazione, con un padding in fondo che le lascia lo spazio.
 */
function ChatThread({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { knownAccountIds, hydrated: socialHydrated } = useVitaecomSocial();
  const { hydrated: chatHydrated, messagesWith } = useVitaecomChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const hydrated = profileHydrated && socialHydrated && chatHydrated;
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(accountId, userAccount);
  const known = knownAccountIds.includes(accountId);
  const thread = messagesWith(accountId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-32 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex shrink-0 items-center gap-3">
        <button onClick={() => router.back()} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Indietro">
          <ArrowLeft size={18} />
        </button>
        <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
        <p className="font-display text-sm text-ink-100">@{account.nickname}</p>
      </div>

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
            <div key={m.id} className={`flex ${m.fromUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-xl2 px-3.5 py-2.5 text-sm ${
                  m.fromUser ? "bg-[#B79A6B]/20 text-ink-100" : "border border-white/10 bg-white/[0.03] text-ink-200"
                }`}
              >
                <MessageMedia photoKey={m.photoKey} videoKey={m.videoKey} />
                {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                <p className="mt-1 text-[10px] text-ink-800">{timeOf(m.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
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
