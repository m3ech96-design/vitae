"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Trash2, EyeOff, UserX } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";

const MENU_WIDTH = 240;

/**
 * Il pulsante a tre puntini in alto a destra di ogni post — un proprio post ha solo
 * "Elimina post"; un post altrui ha "Non mi interessa questo post" (lo toglie dal tuo
 * Vitaeworld) e "Nascondi tutti i post di questo utente" (niente più suoi post né sue
 * notifiche). "Segnala questo post" manca apposta: il processo di segnalazione — cosa vede
 * chi segnala, cosa succede dopo — resta da decidere insieme prima di costruirlo.
 */
export function PostMenu({ postId, authorId, isOwn }: { postId: string; authorId: string; isOwn: boolean }) {
  const { removePost, hidePost, muteAccount } = useVitaecomSocial();
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
      const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-ink-700 transition hover:bg-white/[0.06] hover:text-ink-200"
        aria-label="Altre opzioni"
      >
        <MoreHorizontal size={16} />
      </button>

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
                className="glass-strong z-50 overflow-hidden rounded-xl2 p-1.5"
              >
                {isOwn ? (
                  <button
                    onClick={() => {
                      setOpen(false);
                      removePost(postId);
                    }}
                    className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-aura-pink hover:bg-aura-pink/[0.08]"
                  >
                    <Trash2 size={15} /> Elimina post
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setOpen(false);
                        hidePost(postId);
                      }}
                      className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                    >
                      <EyeOff size={15} className="text-ink-600" /> Non mi interessa questo post
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        muteAccount(authorId);
                      }}
                      className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                    >
                      <UserX size={15} className="text-ink-600" /> Nascondi tutti i post di questo utente
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
