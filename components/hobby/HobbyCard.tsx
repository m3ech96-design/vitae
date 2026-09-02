"use client";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Hobby, HOBBY_BLOCK_LABELS } from "@/lib/hobby-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { GlassCard } from "../ui/GlassCard";

function CoverPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl2 bg-white/[0.03] text-ink-800">
        <Sparkles size={20} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-square w-full rounded-xl2 object-cover" />;
}

export function HobbyCard({ hobby }: { hobby: Hobby }) {
  return (
    <Link href={`/hobby/${hobby.id}`}>
      <GlassCard className="overflow-hidden p-2.5 transition hover:border-white/20">
        <CoverPhoto photoKey={hobby.photoKey} />
        <p className="mt-2 truncate font-display text-sm text-ink-100">{hobby.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-600">
          {hobby.blocks.length === 0 ? "Nessun blocco ancora" : hobby.blocks.map((b) => b.title || HOBBY_BLOCK_LABELS[b.kind]).join(" · ")}
        </p>
      </GlassCard>
    </Link>
  );
}
