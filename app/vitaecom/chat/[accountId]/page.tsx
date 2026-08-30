"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function ChatThread({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { knownAccountIds, hydrated: socialHydrated } = useVitaecomSocial();
  const { hydrated: chatHydrated, messagesWith, sendMessage } = useVitaecomChat();
  const [draft, setDraft] = useState("");
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

  const submit = () => {
    if (!draft.trim()) return;
    sendMessage(accountId, draft);
    setDraft("");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-4 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex shrink-0 items-center gap-3">
        <button onClick={() => router.back()} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Indietro">
          <ArrowLeft size={18} />
        </button>
        <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
        <p className="font-display text-sm text-ink-100">@{account.nickname}</p>
      </div>

      {!known ? (
        <p className="mt-10 text-center text-sm text-ink-800">
          Conosci Prima @{account.nickname} Per Poterle Scrivere — Vai Al Suo Profilo E Tocca &quot;Inizia A
          Conoscere&quot;.
        </p>
      ) : (
        <>
          <div className="mt-6 flex-1 space-y-3 overflow-y-auto pb-4">
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
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className="mt-1 text-[10px] text-ink-800">{timeOf(m.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.06] pt-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Scrivi un messaggio…"
              className="focus-ring flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
            />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B79A6B]/20 text-[#B79A6B] transition disabled:opacity-40"
              aria-label="Invia"
            >
              <Send size={16} />
            </button>
          </div>
        </>
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
