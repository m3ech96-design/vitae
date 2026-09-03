"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuraAvatar } from "../ui/AuraAvatar";
import { VitaecomAccount } from "@/lib/vitaecom-social-types";

export function TaggedAvatars({ accounts }: { accounts: VitaecomAccount[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (accounts.length === 0) return null;

  return (
    <div className="relative">
      {/* Solo l'acchiappa-click invisibile va oltre lo schermo intero — se questo componente
       * finisce dentro un GlassCard (overflow-hidden), resterebbe altrimenti grande solo
       * quanto la card, e toccare fuori dal popover ma dentro lo schermo non lo chiuderebbe. */}
      {open && mounted && createPortal(<div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />, document.body)}
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
              <Link
                key={a.id}
                href={a.id === "user" ? "/vitaecom/profilo" : `/vitaecom/u/${a.id}`}
                className="focus-ring flex items-center gap-2 pr-3"
              >
                <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={26} ring="idle" />
                <span className="text-xs text-ink-200">{a.nickname}</span>
              </Link>
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
