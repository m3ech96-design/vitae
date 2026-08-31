"use client";
import Link from "next/link";
import { Gem, UserPlus, UserCheck, MessageCircle, AtSign, Home, Sparkles } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useProfile } from "@/lib/profile-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { GlassCard } from "../ui/GlassCard";

const KIND_ICON = {
  like: Gem,
  comment: MessageCircle,
  know_request: UserPlus,
  know_accepted: UserCheck,
  tag: AtSign,
  household_request: Home,
  household_accepted: Home,
  reaction: Sparkles,
} as const;
const KIND_TEXT: Record<string, string> = {
  like: "ha messo Mi Piace al tuo post",
  comment: "ha commentato il tuo post",
  know_request: "vuole conoscerti",
  know_accepted: "ha accettato!",
  tag: "ti ha taggato in un post",
  household_request: "desidera aggiungersi nella tua casa",
  household_accepted: "è entrato/a nella tua casa",
};

/**
 * "Tutta l'attività che genera notifiche in Vitaecom apparirà sempre sia nella Home che
 * nella finestra 'Notifiche'" — questa è la metà Home di quella promessa: solo le non
 * lette, al massimo 3, mai un elenco lungo quanto quello vero dentro Vitaecom stesso.
 */
export function VitaecomNotificationsCard() {
  const { notifications, hydrated, mutedAccountIds } = useVitaecomSocial();
  const { profile } = useProfile();
  const { allMoods } = useMood();
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const unread = notifications.filter((n) => !n.read && !mutedAccountIds.includes(n.fromAccountId)).slice(0, 3);

  if (!hydrated || unread.length === 0) return null;

  return (
    <Link href="/vitaecom/chat">
      <GlassCard className="flex flex-col gap-2.5 p-4">
        <p className="font-display text-xs uppercase tracking-[0.14em] text-[#B79A6B]">Notifiche Vitaecom</p>
        {unread.map((n) => {
          const Icon = KIND_ICON[n.kind];
          const account = resolveAccount(n.fromAccountId, userAccount);
          const reactionMood = n.kind === "reaction" ? allMoods.find((m) => m.id === n.moodId) : undefined;
          return (
            <p key={n.id} className="flex items-center gap-2 text-xs text-ink-300">
              <Icon size={13} className="shrink-0 text-[#B79A6B]" />
              {n.kind === "reaction" ? (
                <>
                  Il tuo post ha reso <span className="text-ink-100">{account.nickname}</span>{" "}
                  <span style={{ color: reactionMood?.color }}>{reactionMood?.label ?? ""}</span>
                </>
              ) : (
                <>
                  <span className="text-ink-100">{account.nickname}</span> {KIND_TEXT[n.kind]}
                </>
              )}
            </p>
          );
        })}
      </GlassCard>
    </Link>
  );
}
