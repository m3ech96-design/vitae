"use client";
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { VitaecomComment, VitaecomPost } from "@/lib/vitaecom-social-types";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { useProfile } from "@/lib/profile-context";
import { AuraAvatar } from "../ui/AuraAvatar";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

function formatForward(comment: VitaecomComment, postAuthorNickname: string): string {
  const d = new Date(comment.createdAt);
  const date = d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return `Commento Del Post Di ${postAuthorNickname} Del ${date} Alle ${time}:\n${comment.text}`;
}

/**
 * "Il sistema copia le informazioni del commento... e apre una finestra di scelta se
 * inviarlo a Persone o condividerlo all'esterno (whatsapp e altro)." Condividere fuori
 * dall'app è reale (Web Share API, o appunti dove non è disponibile) — inviarlo a un
 * account Vitaecom invece no, perché senza una vera chat non c'è nessun posto dove quel
 * messaggio possa davvero arrivare: qui resta comunque solo una copia formattata, dichiarata.
 */
export function ForwardComment({
  comment,
  post,
  onClose,
}: {
  comment: VitaecomComment;
  post: VitaecomPost;
  onClose: () => void;
}) {
  const { profile } = useProfile();
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const postAuthor = resolveAccount(post.authorId, { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl });
  const text = formatForward(comment, postAuthor.nickname);
  const recentAccounts = DEMO_ACCOUNTS.slice(0, 5);

  const shareExternal = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // annullato dall'utente o non riuscito: nessun problema, resta la scelta di copiare
      }
    }
    await navigator.clipboard.writeText(text);
    setCopiedFor("__external__");
    setTimeout(() => setCopiedFor(null), 1600);
  };

  const copyForContact = async (accountId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedFor(accountId);
    setTimeout(() => setCopiedFor(null), 1600);
  };

  return (
    <PersonalCardSheet title="Inoltra commento" onClose={onClose}>
      <div className="rounded-xl2 border border-white/10 bg-white/[0.02] p-3">
        <p className="whitespace-pre-wrap text-xs text-ink-600">{text}</p>
      </div>

      <button
        onClick={shareExternal}
        className="focus-ring mt-4 flex w-full items-center justify-between rounded-xl2 border border-white/10 px-4 py-3 text-sm text-ink-200 transition hover:border-white/25"
      >
        <span className="flex items-center gap-2">
          <Share2 size={15} /> Condividi fuori da Vitaecom
        </span>
        {copiedFor === "__external__" && (
          <span className="flex items-center gap-1 text-xs text-aura-cyan">
            <Check size={12} /> Copiato
          </span>
        )}
      </button>

      <p className="mb-2 mt-5 text-xs uppercase tracking-[0.1em] text-ink-800">Recenti su Vitaecom</p>
      <div className="space-y-2">
        {recentAccounts.map((a) => (
          <button
            key={a.id}
            onClick={() => copyForContact(a.id)}
            className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/10 px-3 py-2.5 text-left transition hover:border-white/25"
          >
            <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={32} ring="idle" />
            <span className="flex-1 truncate text-sm text-ink-100">{a.nickname}</span>
            {copiedFor === a.id ? (
              <span className="flex items-center gap-1 text-xs text-aura-cyan">
                <Check size={12} /> Copiato
              </span>
            ) : (
              <Copy size={13} className="text-ink-800" />
            )}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-ink-800">
        Senza una vera chat, qui copiamo il testo formattato — non c&apos;è ancora un posto dove recapitarlo davvero.
      </p>
    </PersonalCardSheet>
  );
}
