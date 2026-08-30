"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Bell, Gem, UserPlus, UserCheck } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useProfile } from "@/lib/profile-context";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m Fa`;
  return `${Math.floor(mins / 60)}h Fa`;
}

/**
 * "Messaggi" è diventato "Notifiche" — non solo il nome: tutta l'attività che genera una
 * notifica in Vitaecom (Mi Piace, commenti, richieste "Inizia A Conoscere", accettazioni)
 * finisce qui, non solo i commenti/Mi Piace di prima. La lista sotto non è più "tutti gli
 * account dimostrativi come anteprima morta" — sono le conversazioni vere (anche se
 * semplici) con chi conosci davvero, vedi lib/vitaecom-chat-context.tsx.
 */
function ChatList() {
  const router = useRouter();
  const { profile } = useProfile();
  const { notifications, hasUnreadNotification, markNotificationsRead, knownAccountIds } = useVitaecomSocial();
  const { messagesWith } = useVitaecomChat();
  const [notifOpen, setNotifOpen] = useState(false);
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const knownAccounts = DEMO_ACCOUNTS.filter((a) => knownAccountIds.includes(a.id));

  const goToNotification = (fromAccountId: string) => {
    setNotifOpen(false);
    router.push(`/vitaecom/u/${fromAccountId}`);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#B79A6B]" />
          <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Chat</p>
        </div>
        <button
          onClick={() => {
            setNotifOpen(true);
            markNotificationsRead();
          }}
          className="focus-ring relative flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-200"
        >
          <Bell size={13} /> Notifiche
          {hasUnreadNotification && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#B79A6B]" />}
        </button>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Conversazioni</h1>

      <div className="mt-6 space-y-2.5">
        {knownAccounts.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-800">
            Non conosci ancora nessuno con cui chattare — vedi la scheda &quot;persone&quot;.
          </p>
        )}
        {knownAccounts.map((a) => {
          const thread = messagesWith(a.id);
          const last = thread[thread.length - 1];
          return (
            <Link key={a.id} href={`/vitaecom/chat/${a.id}`} className="focus-ring flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
              <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={48} ring="idle" glowColor="#B79A6B" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">@{a.nickname}</p>
                <p className="truncate text-xs text-ink-800">{last ? last.text : "Nessun Messaggio Ancora — Scrivi Tu Per Primo."}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {notifOpen && (
        <PersonalCardSheet title="Notifiche" onClose={() => setNotifOpen(false)}>
          {notifications.length === 0 && <p className="text-sm text-ink-800">Nessuna notifica ancora.</p>}
          {notifications.map((n) => {
            const account = resolveAccount(n.fromAccountId, userAccount);
            return (
              <button
                key={n.id}
                onClick={() => goToNotification(n.fromAccountId)}
                className="focus-ring mt-3 flex w-full items-center gap-3 text-left first:mt-0"
              >
                <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-200">
                    <span className="text-ink-100">{account.nickname}</span>{" "}
                    {n.kind === "like" ? (
                      <>
                        <Gem size={10} className="mb-0.5 inline" /> ha messo Mi Piace al tuo post
                      </>
                    ) : n.kind === "comment" ? (
                      "ha commentato il tuo post"
                    ) : n.kind === "know_request" ? (
                      <>
                        <UserPlus size={10} className="mb-0.5 inline" /> vuole conoscerti
                      </>
                    ) : (
                      <>
                        <UserCheck size={10} className="mb-0.5 inline" /> ha accettato!
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-ink-800">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </PersonalCardSheet>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <NicknameGate>
      <ChatList />
    </NicknameGate>
  );
}
