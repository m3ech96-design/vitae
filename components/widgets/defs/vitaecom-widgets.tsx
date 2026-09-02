"use client";
import { Sparkles, MessageSquareText, ThumbsUp, Mail, Smile } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { useMood } from "@/lib/mood-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function UnseenStoriesWidget({ size }: { size: WidgetSize }) {
  const { posts, seenStoryIds } = useVitaecomSocial();
  const now = new Date().toISOString();
  const activeStories = posts.filter((p) => p.isStory && p.expiresAt && p.expiresAt > now);
  const unseen = activeStories.filter((p) => !seenStoryIds.includes(p.id)).length;
  return <WidgetStat icon={Sparkles} value={unseen} label={unseen === 1 ? "Storia da vedere" : "Storie da vedere"} color="#7C5CFF" />;
}

export function LastPostWidget({ size }: { size: WidgetSize }) {
  const { posts } = useVitaecomSocial();
  const own = [...posts].filter((p) => p.authorId === "user" && !p.isStory).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!own) return <WidgetStat icon={MessageSquareText} value="—" label="Nessun post pubblicato" color="#565B77" />;
  return <WidgetStat icon={MessageSquareText} value={own.caption?.slice(0, 40) || "Post senza testo"} label="Il tuo ultimo post" color="#B79A6B" />;
}

export function NewReactionsWidget({ size }: { size: WidgetSize }) {
  const { posts } = useVitaecomSocial();
  const own = posts.filter((p) => p.authorId === "user");
  const totalLikes = own.reduce((s, p) => s + p.likeCount, 0);
  const totalComments = own.reduce((s, p) => s + p.comments.length, 0);
  return <WidgetStat icon={ThumbsUp} value={totalLikes + totalComments} label="Reazioni e commenti ricevuti" color="#FF6B9D" />;
}

export function LastReceivedMessageWidget({ size }: { size: WidgetSize }) {
  const { messages } = useVitaecomChat();
  const last = [...messages].filter((m) => !m.fromUser).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!last) return <WidgetEmpty icon={Mail} label="Nessun messaggio ricevuto" />;
  const account = DEMO_ACCOUNTS.find((a) => a.id === last.accountId);
  return <WidgetStat icon={Mail} value={last.text.slice(0, 40) || "Messaggio multimediale"} label={`@${account?.nickname ?? "?"}`} color="#7C5CFF" />;
}

export function QuickMoodPickerWidget({ size }: { size: WidgetSize }) {
  const { allMoods, activeMood, setMoodManually } = useMood();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <p className="flex items-center gap-1 text-[11px] text-ink-600">
        <Smile size={12} /> Come ti senti?
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {allMoods.slice(0, 6).map((m) => (
          <button
            key={m.id}
            onClick={() => setMoodManually(m.id)}
            className="h-5 w-5 rounded-full border transition"
            style={{
              background: activeMood?.moodId === m.id ? m.color : `${m.color}33`,
              borderColor: `${m.color}88`,
            }}
            title={m.label}
            aria-label={m.label}
          />
        ))}
      </div>
    </div>
  );
}
