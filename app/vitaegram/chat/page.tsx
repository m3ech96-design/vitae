"use client";
import { useState } from "react";
import { MessageSquare, Bell, X, Gem } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/vitaegram-demo-data";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { resolveAccount } from "@/lib/vitaegram-resolve";
import { useProfile } from "@/lib/profile-context";
import { NicknameGate } from "@/components/vitaegram/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m Fa`;
  return `${Math.floor(mins / 60)}h Fa`;
}

function ChatList() {
  const { profile } = useProfile();
  const { notifications, hasUnreadNotification, markNotificationsRead } = useVitaegramSocial();
  const [notifOpen, setNotifOpen] = useState(false);
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };

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
          <Bell size={13} /> Messaggi
          {hasUnreadNotification && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#B79A6B]" />}
        </button>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Conversazioni</h1>
      <p className="mt-1.5 text-xs text-ink-800">
        Senza Un Vero Account Dall&apos;Altra Parte, La Chat Vera Non Può Ancora Funzionare — Ecco Come Si Presenterà.
      </p>

      <div className="mt-6 space-y-2.5">
        {DEMO_ACCOUNTS.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl2 border p-3 opacity-60"
            style={{ borderColor: "rgba(183,154,107,0.35)" }}
          >
            <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={48} ring="idle" glowColor="#B79A6B" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">{a.nickname}</p>
              <p className="truncate text-xs text-ink-800">Anteprima — Nessun Messaggio Vero Ancora</p>
            </div>
          </div>
        ))}
      </div>

      {notifOpen && (
        <PersonalCardSheet title="Messaggi" onClose={() => setNotifOpen(false)}>
          {notifications.length === 0 && <p className="text-sm text-ink-800">Nessuna Notifica Ancora.</p>}
          {notifications.map((n) => {
            const account = resolveAccount(n.fromAccountId, userAccount);
            return (
              <div key={n.id} className="mt-3 flex items-center gap-3 first:mt-0">
                <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-200">
                    <span className="text-ink-100">{account.nickname}</span>{" "}
                    {n.kind === "like" ? (
                      <>
                        <Gem size={10} className="mb-0.5 inline" /> Ha Messo Mi Piace Al Tuo Post
                      </>
                    ) : (
                      "Ha Commentato Il Tuo Post"
                    )}
                  </p>
                  <p className="text-[10px] text-ink-800">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
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
