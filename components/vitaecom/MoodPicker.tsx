"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";

const MENU_WIDTH = 240;

/**
 * Sfera-pulsante che apre un selettore di stati d'animo ancorato alla sua posizione (stesso
 * pattern-portal già usato altrove — PersonalCardMenu, ProfileHeader) — usato sia per "Cosa
 * Provi?" nella condivisione di un post sia per la sfera di reazione sotto ogni post: stessa
 * interazione, stesso elenco (tutti gli stati d'animo, anche quelli creati dall'utente).
 */
export function MoodPicker({
  size,
  color,
  onPick,
  label,
}: {
  /** Diametro della sfera in pixel. */
  size: number;
  /** Colore attuale della sfera — grigio neutro se non ancora scelto nulla. */
  color: string;
  onPick: (moodId: string) => void;
  label?: string;
}) {
  const { allMoods } = useMood();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8));
      setPos({ top: rect.bottom + 8, left });
    };
    position();
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", position);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label ?? "Scegli uno stato d'animo"}
        className="focus-ring shrink-0 rounded-full border border-white/20 transition-[background-color] duration-1000"
        style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, ${color}, ${color}cc)`, boxShadow: `0 0 10px ${color}88` }}
      />
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
                className="glass-strong z-[70] max-h-64 overflow-y-auto rounded-xl2 p-2"
              >
                <div className="flex flex-wrap gap-2 p-1">
                  {allMoods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onPick(m.id);
                        setOpen(false);
                      }}
                      className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-xs text-ink-200 transition hover:border-white/25"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
