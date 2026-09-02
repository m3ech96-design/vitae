"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Conversazione di gruppo — sempre e solo i tuoi messaggi (vedi la nota su
 * VitaecomGroupMessage in vitaecom-chat-context.tsx: qui non si simula nessuna attività
 * degli altri membri, che restano scritti solo come promemoria di chi fa parte del gruppo).
 */
function GroupThread({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { hydrated: chatHydrated, groupById, messagesInGroup } = useVitaecomChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const hydrated = profileHydrated && chatHydrated;
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const group = groupById(groupId);
  const thread = group ? messagesInGroup(groupId) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!hydrated) return null;

  if (!group) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-xl px-5 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
        <button onClick={() => router.push("/vitaecom/chat")} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
          <ArrowLeft size={16} /> Chat
        </button>
        <p className="mt-10 text-center text-sm text-ink-800">Questo gruppo non esiste (più).</p>
      </div>
    );
  }

  const members = group.memberIds.map((id) => resolveAccount(id, userAccount));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col pb-32">
      <div className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-white/[0.05] bg-void-950/90 px-5 pb-3 pt-[max(env(safe-area-inset-top),1.1rem)] backdrop-blur-md sm:px-6">
        <button onClick={() => router.push("/vitaecom/chat")} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Indietro">
          <ArrowLeft size={20} />
        </button>
        <div className="flex -space-x-3">
          {members.slice(0, 3).map((m) => (
            <AuraAvatar key={m.id} imageUrl={m.avatarUrl} firstName={m.nickname} size={38} ring="none" className="ring-2 ring-void-950" />
          ))}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base text-ink-100">{group.name}</p>
          <p className="flex items-center gap-1 truncate text-[10px] text-ink-800">
            <Users size={10} /> {members.map((m) => `@${m.nickname}`).join(", ")}
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <div className="mt-6 flex-1 space-y-3 pb-4">
          {thread.length === 0 && <p className="mt-10 text-center text-sm text-ink-800">Scrivi il primo messaggio a {group.name}.</p>}
          {thread.map((m) => (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-xl2 bg-[#B79A6B]/20 px-3.5 py-2.5 text-sm text-ink-100">
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className="mt-1 text-[10px] text-ink-800">{timeOf(m.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

export default function GroupChatPage({ params }: { params: { groupId: string } }) {
  return (
    <NicknameGate>
      <GroupThread groupId={params.groupId} />
    </NicknameGate>
  );
}
