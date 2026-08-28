"use client";
import { useState } from "react";
import { Gem, CornerDownRight, Send } from "lucide-react";
import { VitaegramPost, VitaegramComment } from "@/lib/vitaegram-social-types";
import { resolveAccount } from "@/lib/vitaegram-resolve";
import { useProfile } from "@/lib/profile-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

function CommentRow({
  comment,
  postId,
  indented,
  onReply,
}: {
  comment: VitaegramComment;
  postId: string;
  indented?: boolean;
  onReply: (commentId: string) => void;
}) {
  const { profile } = useProfile();
  const { toggleCommentLike } = useVitaegramSocial();
  const account = resolveAccount(comment.authorId, { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl });

  return (
    <div className={indented ? "ml-8 mt-3" : "mt-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-100">
            {account.nickname} <span className="ml-1.5 text-ink-800">{timeAgo(comment.createdAt)}</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-200">{comment.text}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <button
          onClick={() => toggleCommentLike(postId, comment.id, indented ? comment.id : undefined)}
          className="focus-ring flex items-center gap-1 text-ink-800"
        >
          <Gem size={11} fill={comment.likedByUser ? "#B79A6B" : "transparent"} color={comment.likedByUser ? "#B79A6B" : "#565B77"} />
          {comment.likeCount > 0 && <span className="text-[10px]">{comment.likeCount}</span>}
        </button>
        {!indented && (
          <button onClick={() => onReply(comment.id)} className="focus-ring flex items-center gap-1 text-[10px] text-ink-800">
            <CornerDownRight size={11} /> Rispondi
          </button>
        )}
      </div>
      {comment.replies.map((r) => (
        <CommentRow key={r.id} comment={r} postId={postId} indented onReply={onReply} />
      ))}
    </div>
  );
}

export function PostComments({ post, onClose }: { post: VitaegramPost; onClose: () => void }) {
  const { addComment } = useVitaegramSocial();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const submit = () => {
    if (!text.trim()) return;
    addComment(post.id, text, replyTo ?? undefined);
    setText("");
    setReplyTo(null);
  };

  return (
    <PersonalCardSheet title="Commenti" onClose={onClose}>
      {post.comments.length === 0 && <p className="text-sm text-ink-800">Nessun Commento Ancora — Il Primo Tocca A Te.</p>}
      {post.comments.map((c) => (
        <CommentRow key={c.id} comment={c} postId={post.id} onReply={setReplyTo} />
      ))}
      <div className="sticky bottom-0 mt-5 -mx-6 border-t border-white/10 bg-void-950/95 px-6 pt-3 backdrop-blur">
        {replyTo && (
          <p className="mb-1.5 flex items-center gap-1 text-[10px] text-ink-800">
            <CornerDownRight size={10} /> Stai Rispondendo A Un Commento
            <button onClick={() => setReplyTo(null)} className="ml-1 text-aura-pink">Annulla</button>
          </p>
        )}
        <div className="flex items-center gap-2 pb-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Scrivi Un Commento…"
            className="focus-ring flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <button onClick={submit} disabled={!text.trim()} className="focus-ring text-aura-cyan disabled:opacity-30" aria-label="Invia">
            <Send size={18} />
          </button>
        </div>
      </div>
    </PersonalCardSheet>
  );
}
