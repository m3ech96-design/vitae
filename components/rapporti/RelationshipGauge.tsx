"use client";
import { motion } from "framer-motion";
import { Crown, Flame, Heart } from "lucide-react";
import { Person } from "@/lib/types";
import { AuraAvatar } from "../ui/AuraAvatar";

export function RelationshipGauge({ person }: { person: Person }) {
  const position = ((person.relationshipScore + 100) / 200) * 100; // 0..100%

  return (
    <div className="pt-9">
      <div className="relative">
        <motion.div
          className="absolute -top-9 flex flex-col items-center"
          style={{ left: `${position}%` }}
          animate={{ left: `${position}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <div className="-translate-x-1/2">
            <AuraAvatar
              imageUrl={person.avatarUrl}
              firstName={person.firstName}
              lastName={person.lastName}
              size={44}
              ring="none"
              className="ring-2 ring-void-950 rounded-full shadow-glow-sm"
            />
          </div>
          <span className="h-3 w-px bg-white/25" />
        </motion.div>

        <div
          className="h-3.5 w-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #FF1F4B 0%, #FF6B9D 22%, #3A3F55 50%, #7C5CFF 78%, #FFD86B 100%)",
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-ink-800">
        <span>Inimicizia</span>
        <span>Indifferenza</span>
        <span>Amicizia</span>
      </div>

      {(person.trueFriendshipScore > 0 || person.deepEnmityScore > 0) && (
        <div className="mt-5 flex justify-center">
          {person.trueFriendshipScore > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[#FFD86B]/30 bg-[#FFD86B]/[0.06] px-4 py-2">
              <Crown size={14} className="text-[#FFD86B]" />
              <span className="text-xs text-ink-200">
                Vera Amicizia · {Math.round(person.trueFriendshipScore)}%
              </span>
            </div>
          )}
          {person.deepEnmityScore > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[#FF1F4B]/30 bg-[#FF1F4B]/[0.06] px-4 py-2">
              <Flame size={14} className="text-[#FF1F4B]" />
              <span className="text-xs text-ink-200">
                Profonda Inimicizia · {Math.round(person.deepEnmityScore)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LoveGauge({ value }: { value: number }) {
  return (
    <div className="rounded-xl2 border border-aura-pink/20 bg-aura-pink/[0.04] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          <Heart size={12} className="fill-aura-pink text-aura-pink" /> Amore
        </span>
        <span className="text-sm text-aura-pink">{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #FF6B9D, #FF1F4B)", boxShadow: "0 0 10px #FF6B9Daa" }}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
