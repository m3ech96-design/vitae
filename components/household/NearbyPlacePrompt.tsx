"use client";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Check, X } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { PLACE_TYPE_META } from "@/lib/places-meta";

export function NearbyPlacePrompt() {
  const { nearbyPlace, confirmNearbyPlace, dismissNearbyPlace } = useHousehold();

  return (
    <AnimatePresence>
      {nearbyPlace && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-x-4 top-[max(env(safe-area-inset-top),16px)] z-[80] mx-auto max-w-sm"
        >
          <div className="glass-strong flex items-center gap-3 rounded-xl2 border border-aura-cyan/30 p-4 shadow-glow-cyan">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${PLACE_TYPE_META[nearbyPlace.type].color}22` }}
            >
              <MapPin size={18} style={{ color: PLACE_TYPE_META[nearbyPlace.type].color }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-100">
                Sei attualmente a <span className="font-display">{nearbyPlace.name}</span>?
              </p>
            </div>
            <button
              onClick={dismissNearbyPlace}
              className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-600 hover:text-ink-200"
              aria-label="No"
            >
              <X size={15} />
            </button>
            <button
              onClick={confirmNearbyPlace}
              className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950"
              aria-label="Sì"
            >
              <Check size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
