"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { VitaecomAccount, VitaecomPost } from "@/lib/vitaecom-social-types";
import { useMood } from "@/lib/mood-context";
import { AuraAvatar } from "../ui/AuraAvatar";

/**
 * La card della scheda Persone — stesso taglio visivo di PersonCard in Mondo (identica,
 * come richiesto), ma per un account Vitaecom invece che per una Persona del tuo Mondo:
 * l'icona Chat al posto di WhatsApp (qui la conversazione è quella vera di Vitaecom, non un
 * link esterno). Niente più numero di telefono qui: veniva da una Persona di Mondo
 * collegata a questo account, un concetto eliminato apposta (Mondo e Persone restano due
 * cose distinte finché non si uniranno davvero in una sola).
 *
 * Non è un <Link> come il resto della card: un <a> (quello che <Link> genera) dentro un
 * altro <a> — qui sotto c'è anche quello della chat — non è HTML valido, lo stesso bug già
 * corretto più volte in questa sessione (PersonCard, PersonalCardMenu). Un <div
 * role="button"> con la navigazione via router risolve senza perderla.
 */
export function VitaecomAccountCard({ account, posts }: { account: VitaecomAccount; posts: VitaecomPost[] }) {
  const router = useRouter();
  const { allMoods } = useMood();

  const ownPosts = posts.filter((p) => p.authorId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const mood = allMoods.find((m) => m.id === ownPosts[0]?.moodId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/vitaecom/u/${account.id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push(`/vitaecom/u/${account.id}`)}
      className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15"
    >
      <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={52} ring="idle" glowColor={mood?.color ?? "#B79A6B"} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm text-ink-100">@{account.nickname}</p>
        <p className="truncate text-xs text-ink-800">{mood ? mood.label : "Persona Conosciuta"}</p>
      </div>
      <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/vitaecom/chat/${account.id}`}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:border-[#B79A6B]/50 hover:text-[#B79A6B]"
          aria-label={`Apri la chat con ${account.nickname}`}
        >
          <MessageSquare size={14} />
        </Link>
      </div>
    </div>
  );
}
