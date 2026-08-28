"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuraAvatar } from "../ui/AuraAvatar";
import { VitaegramAccount } from "@/lib/vitaegram-social-types";

export function TaggedAvatars({ accounts }: { accounts: VitaegramAccount[] }) {
  const [open, setOpen] = useState(false);
  if (accounts.length === 0) return null;

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />}
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="glass-strong relative z-20 flex flex-col gap-2 rounded-xl2 p-2"
            onClick={() => setOpen(false)}
          >
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 pr-3">
                <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={26} ring="idle" />
                <span className="text-xs text-ink-200">{a.nickname}</span>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.button
            key="stack"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="focus-ring relative z-20 flex items-center"
          >
            {accounts.slice(0, 4).map((a, i) => (
              <span key={a.id} className="-ml-2.5 first:ml-0" style={{ zIndex: accounts.length - i }}>
                <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={24} ring="idle" />
              </span>
            ))}
            {accounts.length > 4 && (
              <span className="-ml-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-void-950 bg-void-800 text-[9px] text-ink-400">
                +{accounts.length - 4}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
