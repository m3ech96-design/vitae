"use client";
import { Play } from "lucide-react";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { useDiary } from "@/lib/diary-context";
import { useVideoScrubPreview } from "@/lib/use-video-scrub-preview";

export function VideoThumb({ videoKey, onClick }: { videoKey: string; onClick?: () => void }) {
  const url = useResolvedVideo(videoKey);
  const { scrubPreviewEnabled } = useDiary();
  const { ref, currentFrame } = useVideoScrubPreview(url, scrubPreviewEnabled);

  return (
    <div ref={ref} className="relative aspect-square w-full overflow-hidden rounded-xl2 bg-white/[0.03]">
      <button type="button" onClick={onClick} className="absolute inset-0 h-full w-full">
        {currentFrame ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentFrame} alt="" className="h-full w-full object-cover transition-opacity duration-300" />
        ) : (
          url && <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-void-950/15">
          <Play size={18} className="text-white drop-shadow" fill="white" />
        </span>
      </button>
    </div>
  );
}
