"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Aperture, User, PawPrint } from "lucide-react";
import { AddPersonModal } from "@/components/persone/AddPersonModal";
import { VitaecomHouseholdPicker } from "./VitaecomHouseholdPicker";

const MENU_WIDTH = 200;

/**
 * Il tasto "+" del riquadro Casa, evoluto: non apre più direttamente il wizard di una
 * persona, ma una finestrella "Aggiungi:" ancorata alla sua posizione (stesso pattern di
 * PersonalCardMenu — portal su document.body, coordinate reali misurate al momento
 * dell'apertura) con tre strade diverse.
 */
export function AddToHouseholdMenu() {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState<"vitaecom" | "offline" | "animali" | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left - MENU_WIDTH / 2 + rect.width / 2, window.innerWidth - MENU_WIDTH - 8));
      setMenuPos({ top: rect.bottom + 10, left });
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
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (which: "vitaecom" | "offline" | "animali") => {
    setOpen(false);
    setModal(which);
  };

  return (
    <>
      <button ref={buttonRef} onClick={() => setOpen((v) => !v)} className="focus-ring flex flex-col items-center gap-1.5">
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50 hover:text-ink-200">
          <Plus size={18} />
        </span>
        <span className="text-[11px] text-ink-600">Aggiungi</span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && menuPos && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
                className="glass-strong z-50 overflow-hidden rounded-xl2 p-1.5"
              >
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-ink-800">Aggiungi:</p>
                <button
                  onClick={() => choose("vitaecom")}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                >
                  <Aperture size={15} className="text-[#B79A6B]" /> Da Vitaecom
                </button>
                <button
                  onClick={() => choose("offline")}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                >
                  <User size={15} className="text-aura-violet" /> Offline
                </button>
                <button
                  onClick={() => choose("animali")}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                >
                  <PawPrint size={15} className="text-aura-cyan" /> Animali
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {modal === "vitaecom" && <VitaecomHouseholdPicker onClose={() => setModal(null)} />}
      {modal === "offline" && <AddPersonModal onClose={() => setModal(null)} title="Aggiungi alla casa" lockLivesAtHome />}
      {modal === "animali" && <AddPersonModal onClose={() => setModal(null)} title="Aggiungi animale alla casa" lockLivesAtHome forceAnimal />}
    </>
  );
}
