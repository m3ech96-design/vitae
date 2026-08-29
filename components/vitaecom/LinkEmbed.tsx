"use client";
import { ExternalLink, Link2 } from "lucide-react";
import { DetectedLink } from "@/lib/vitaecom-link-detect";

export function LinkEmbed({ link }: { link: DetectedLink }) {
  if (link.kind === "youtube" || link.kind === "vimeo") {
    const src =
      link.kind === "youtube"
        ? `https://www.youtube.com/embed/${link.videoId}`
        : `https://player.vimeo.com/video/${link.videoId}`;
    return (
      <div className="relative -mx-4 -mt-4 mb-3 aspect-video overflow-hidden bg-void-900">
        <iframe
          src={src}
          title="Video Incorporato"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring mb-3 flex items-center gap-3 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3 transition hover:border-white/20"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-ink-600">
        <Link2 size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-ink-200">{link.domain}</span>
        <span className="block truncate text-[10px] text-ink-800">{link.url}</span>
      </span>
      <ExternalLink size={13} className="shrink-0 text-ink-800" />
    </a>
  );
}
