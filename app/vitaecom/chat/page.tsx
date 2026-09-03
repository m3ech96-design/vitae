"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Bell, Gem, UserPlus, UserCheck, AtSign, Home, Search, Plus, Users, X } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useProfile } from "@/lib/profile-context";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { NewChatModal } from "@/components/vitaecom/NewChatModal";

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
  const { notifications, hasUnreadNotification, markNotificationsRead, knownAccountIds, householdReceivedRequests, respondHouseholdRequest, mutedAccountIds } = useVitaecomSocial();
  const { allMoods } = useMood();
  const { messagesWith, groups, messagesInGroup } = useVitaecomChat();
  const [notifOpen, setNotifOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const knownAccounts = DEMO_ACCOUNTS.filter((a) => knownAccountIds.includes(a.id));

  const q = query.trim().toLocaleLowerCase("it-IT");
  const visibleAccounts = q ? knownAccounts.filter((a) => a.nickname.toLocaleLowerCase("it-IT").includes(q)) : knownAccounts;
  const visibleGroups = q ? groups.filter((g) => g.name.toLocaleLowerCase("it-IT").includes(q)) : groups;

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
      <div className="mt-1 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-100">Conversazioni</h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`focus-ring flex h-9 w-9 items-center justify-center rounded-full border transition ${searchOpen ? "border-[#B79A6B]/50 text-[#B79A6B]" : "border-white/10 text-ink-400 hover:text-ink-100"}`}
            aria-label="Cerca nelle conversazioni"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => setNewChatOpen(true)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:text-ink-100"
            aria-label="Nuova chat"
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mt-3 flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search size={14} className="text-ink-600" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca una persona o un gruppo"
            className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Svuota">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="mt-6 space-y-2.5">
        {visibleAccounts.length === 0 && visibleGroups.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-800">
            {q
              ? "Nessuna conversazione trovata."
              : "Non conosci ancora nessuno con cui chattare — vedi la scheda \"persone\"."}
          </p>
        )}
        {visibleGroups.map((g) => {
          const members = g.memberIds.map((id) => resolveAccount(id, userAccount));
          const thread = messagesInGroup(g.id);
          const last = thread[thread.length - 1];
          return (
            <Link
              key={g.id}
              href={`/vitaecom/chat/gruppo/${g.id}`}
              className="focus-ring flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-400">
                <Users size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{g.name}</p>
                <p className="truncate text-xs text-ink-800">
                  {last ? last.text : `${members.map((m) => `@${m.nickname}`).join(", ")}`}
                </p>
              </div>
            </Link>
          );
        })}
        {visibleAccounts.map((a) => {
          const thread = messagesWith(a.id);
          const last = thread[thread.length - 1];
          return (
            <Link key={a.id} href={`/vitaecom/chat/${a.id}`} className="focus-ring flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
              <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={48} ring="idle" glowColor="#B79A6B" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">@{a.nickname}</p>
                <p className="truncate text-xs text-ink-800">{last ? last.text : "Nessun messaggio ancora — scrivi tu per primo."}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {newChatOpen && <NewChatModal knownAccounts={knownAccounts} onClose={() => setNewChatOpen(false)} />}

      {notifOpen && (
        <PersonalCardSheet title="Notifiche" onClose={() => setNotifOpen(false)}>
          {(() => {
            const visibleNotifications = notifications.filter((n) => !mutedAccountIds.includes(n.fromAccountId));
            if (visibleNotifications.length === 0) return <p className="text-sm text-ink-800">Nessuna notifica ancora.</p>;
            return visibleNotifications.map((n) => {
            const account = resolveAccount(n.fromAccountId, userAccount);
            const reactionMood = n.kind === "reaction" ? allMoods.find((m) => m.id === n.moodId) : undefined;
            const label =
              n.kind === "like" ? (
                <>
                  <Gem size={10} className="mb-0.5 inline" /> ha messo Mi Piace al tuo post
                </>
              ) : n.kind === "comment" ? (
                "ha commentato il tuo post"
              ) : n.kind === "know_request" ? (
                <>
                  <UserPlus size={10} className="mb-0.5 inline" /> vuole conoscerti
                </>
              ) : n.kind === "know_accepted" ? (
                <>
                  <UserCheck size={10} className="mb-0.5 inline" /> ha accettato!
                </>
              ) : n.kind === "household_request" ? (
                <>
                  <Home size={10} className="mb-0.5 inline" /> desidera aggiungersi nella tua casa
                </>
              ) : n.kind === "household_accepted" ? (
                <>
                  <Home size={10} className="mb-0.5 inline" /> è entrato/a nella tua casa
                </>
              ) : n.kind === "reaction" ? (
                <>Il tuo post ha reso {account.nickname} <span style={{ color: reactionMood?.color }}>{reactionMood?.label ?? ""}</span></>
              ) : (
                <>
                  <AtSign size={10} className="mb-0.5 inline" /> ti ha taggato in un post
                </>
              );

            // Una richiesta di Casa in arrivo si accetta/rifiuta qui sul posto — le uniche
            // due notifiche con un esito ancora da decidere, non solo da leggere.
            if (n.kind === "household_request" && householdReceivedRequests.includes(n.fromAccountId)) {
              return (
                <div key={n.id} className="mt-3 flex items-center gap-3 first:mt-0">
                  <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-200">
                      <span className="text-ink-100">{account.nickname}</span> {label}
                    </p>
                    <div className="mt-1.5 flex gap-1.5">
                      <button
                        onClick={() => respondHouseholdRequest(n.fromAccountId, true)}
                        className="focus-ring rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 px-3 py-1 text-[11px] text-ink-100 transition hover:bg-[#B79A6B]/25"
                      >
                        Accetta
                      </button>
                      <button
                        onClick={() => respondHouseholdRequest(n.fromAccountId, false)}
                        className="focus-ring rounded-full border border-white/10 px-3 py-1 text-[11px] text-ink-600 transition hover:text-ink-200"
                      >
                        Rifiuta
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={n.id}
                onClick={() => goToNotification(n.fromAccountId)}
                className="focus-ring mt-3 flex w-full items-center gap-3 text-left first:mt-0"
              >
                <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={36} ring="idle" glowColor="#B79A6B" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-200">
                    {n.kind === "reaction" ? label : (
                      <>
                        <span className="text-ink-100">{account.nickname}</span> {label}
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-ink-800">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
            });
          })()}
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
