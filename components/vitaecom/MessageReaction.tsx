"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";
import { MoodPicker } from "./MoodPicker";

/**
 * Il controllo di reazione sotto un messaggio, con lo stesso testo di stato già visto sui
 * post ("ti sei sentito"/"si è sentito"), ma con una terza combinazione che i post non
 * hanno: quando reagiscono entrambi i lati della stessa chat, "Vi siete sentiti" seguito
 * dalle due sfere sovrapposte, cliccabili, che si aprono in un elenco ancorato.
 */
export function MessageReaction({
  userReactionMoodId,
  otherReactionMoodId,
  onReact,
}: {
  userReactionMoodId?: string;
  otherReactionMoodId?: string;
  onReact: (moodId: string) => void;
}) {
  const { allMoods } = useMood();
  const [listOpen, setListOpen] = useState(false);
  const userMood = userReactionMoodId ? allMoods.find((m) => m.id === userReactionMoodId) : undefined;
  const otherMood = otherReactionMoodId ? allMoods.find((m) => m.id === otherReactionMoodId) : undefined;

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-1.5">
      {userMood ? (
        <button onClick={() => onReact(userMood.id)} className="focus-ring text-[11px]" style={{ color: userMood.color }}>
          {userMood.label}
        </button>
      ) : (
        <MoodPicker size={15} color="#565B77" onPick={onReact} label="Reagisci con uno stato d'animo" />
      )}

      {userMood && otherMood ? (
        <div className="relative">
          <button onClick={() => setListOpen((v) => !v)} className="focus-ring flex items-center gap-1.5 text-[11px] text-ink-600">
            Vi siete sentiti
            <span className="relative flex h-4 w-7 shrink-0">
              <span className="absolute left-0 h-4 w-4 rounded-full border border-void-900" style={{ background: userMood.color }} />
              <span className="absolute left-2.5 h-4 w-4 rounded-full border border-void-900" style={{ background: otherMood.color }} />
            </span>
          </button>
          <AnimatePresence>
            {listOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.14 }}
                className="glass-strong absolute bottom-full left-0 z-20 mb-1.5 w-max rounded-xl2 px-3 py-2 text-[11px]"
              >
                <p className="flex items-center gap-1.5 text-ink-200">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: userMood.color }} /> {userMood.label}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-ink-200">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: otherMood.color }} /> {otherMood.label}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : userMood ? (
        <span className="text-[11px]" style={{ color: userMood.color }}>
          Ti sei sentito/a {userMood.label.toLowerCase()}
        </span>
      ) : otherMood ? (
        <span className="text-[11px]" style={{ color: otherMood.color }}>
          Si è sentito/a {otherMood.label.toLowerCase()}
        </span>
      ) : null}
    </div>
  );
}
