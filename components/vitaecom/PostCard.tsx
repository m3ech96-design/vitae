"use client";
import Link from "next/link";
import { Gem, MessageCircle, Share2 } from "lucide-react";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { resolveAccount, resolveTaggedAccounts } from "@/lib/vitaecom-resolve";
import { useMood } from "@/lib/mood-context";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { detectLink } from "@/lib/vitaecom-link-detect";
import { AuraAvatar } from "../ui/AuraAvatar";
import { TaggedAvatars } from "./TaggedAvatars";
import { LinkEmbed } from "./LinkEmbed";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m Fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h Fa`;
  return `${Math.floor(hours / 24)}g Fa`;
}

export function PostCard({ post, onOpenComments, onShare }: { post: VitaecomPost; onOpenComments: () => void; onShare: () => void }) {
  const { allMoods, activeMood, shareMoodOnVitaecom } = useMood();
  const { profile } = useProfile();
  const { toggleLike } = useVitaecomSocial();
  const resolvedPhotoUrl = useResolvedImage(post.photoKey);

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(post.authorId, userAccount);
  const mood = allMoods.find((m) => m.id === post.moodId);
  const color = mood?.color ?? "#565B77";
  const taggedAccounts = resolveTaggedAccounts(post.tags, userAccount);
  const photoUrl = resolvedPhotoUrl || post.demoPhotoUrl;
  const link = !photoUrl ? detectLink(post.caption) : null;

  // La gemma: il contorno resta il colore dello stato d'animo DEL POST (di chi l'ha
  // scritto), ma il riempimento — quando l'hai messa tu — è il colore del TUO stato
  // d'animo attuale, non quello del post: due persone diverse che guardano lo stesso Mi
  // Piace vedrebbero comunque lo stesso contorno, ma il riempimento racconta come si sente
  // CHI lo sta guardando in questo momento, non chi ha scritto il post.
  const myMood = shareMoodOnVitaecom && activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : undefined;
  const myMoodColor = myMood?.color ?? allMoods.find((m) => m.id === "normale")?.color ?? "#565B77";

  return (
    <div className="overflow-hidden rounded-xl2" style={{ border: `1.5px solid ${color}88`, background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={account.id === "user" ? "/vitaecom/profilo" : `/vitaecom/u/${account.id}`} className="focus-ring flex min-w-0 items-center gap-3">
          <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={40} ring="idle" glowColor={color} />
          <div className="min-w-0">
            <p className="truncate text-sm text-ink-100">{account.nickname}</p>
            {mood && (
              <p className="text-xs" style={{ color }}>
                {mood.label}
              </p>
            )}
          </div>
        </Link>
        <span className="ml-auto shrink-0 text-[10px] text-ink-800">{timeAgo(post.createdAt)}</span>
      </div>

      <div className="mx-4 rounded-xl2 border border-white/[0.06] bg-white/[0.015] p-4">
        {photoUrl && (
          <div className="relative -mx-4 -mt-4 mb-3 aspect-[4/3] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {link && <LinkEmbed link={link} />}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">{post.caption}</p>
        {post.captionByAI && <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-800">Descritto dall&apos;ia</p>}
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => toggleLike(post.id)} className="focus-ring flex items-center gap-1.5" aria-label="Mi piace">
            <Gem size={18} color={color} fill={post.likedByUser ? myMoodColor : "transparent"} strokeWidth={1.6} />
            {post.likeCount > 0 && <span className="text-xs text-ink-600">{post.likeCount}</span>}
          </button>
          <button onClick={onOpenComments} className="focus-ring flex items-center gap-1.5" aria-label="Commenta">
            <MessageCircle size={18} color={color} strokeWidth={1.6} />
            {post.comments.length > 0 && <span className="text-xs text-ink-600">{post.comments.length}</span>}
          </button>
          <button onClick={onShare} className="focus-ring" aria-label="Condividi sulla tua bacheca">
            <Share2 size={17} color="#8B90A8" strokeWidth={1.6} />
          </button>
        </div>
        <TaggedAvatars accounts={taggedAccounts} />
      </div>
    </div>
  );
}
