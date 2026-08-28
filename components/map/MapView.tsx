"use client";
import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./LeafletMap").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-void-800/40">
      <span className="h-2.5 w-2.5 animate-pulseSoft rounded-full bg-aura-gradient shadow-glow-sm" />
    </div>
  ),
});
