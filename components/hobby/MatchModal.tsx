"use client";
import { useState } from "react";
import { X, Trash2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { Match, MatchResult } from "@/lib/hobby-types";
import { todayIso } from "@/lib/date-format";
import { TextField, TextArea } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { PersonPicker } from "../ui/PersonPicker";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

const RESULT_OPTIONS: { id: MatchResult; label: string; color: string }[] = [
  { id: "vittoria", label: "Vittoria", color: "#34D399" },
  { id: "sconfitta", label: "Sconfitta", color: "#FF6B9D" },
  { id: "pareggio", label: "Pareggio", color: "#FFB454" },
];

function PhotoPreview({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function MatchModal({
  hobbyId,
  blockId,
  match,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  match?: Match;
  onClose: () => void;
}) {
  const { addMatch, updateMatch, removeMatch } = useHobby();
  const { places } = usePlaces();
  const { people } = useHousehold();

  const [opponent, setOpponent] = useState(match?.opponent ?? "");
  const [opponentPersonId, setOpponentPersonId] = useState<string | undefined>(match?.opponentPersonId);
  const [date, setDate] = useState(match?.date ?? todayIso());
  const [placeId, setPlaceId] = useState(match?.placeId ?? "");
  const [competition, setCompetition] = useState(match?.competition ?? "");
  const [result, setResult] = useState<MatchResult>(match?.result ?? "vittoria");
  const [score, setScore] = useState(match?.score ?? "");
  const [role, setRole] = useState(match?.role ?? "");
  const [durationMinutes, setDurationMinutes] = useState(match?.durationMinutes ? String(match.durationMinutes) : "");
  const [note, setNote] = useState(match?.note ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(match?.photoKey);

  const submit = () => {
    const payload = {
      opponent: opponent.trim() || undefined,
      opponentPersonId,
      date,
      placeId: placeId || undefined,
      competition: competition.trim() || undefined,
      result,
      score: score.trim() || undefined,
      role: role.trim() || undefined,
      durationMinutes: durationMinutes ? Math.max(0, parseInt(durationMinutes, 10)) : undefined,
      note: note.trim() || undefined,
      photoKey,
    };
    if (match) updateMatch(hobbyId, blockId, match.id, payload);
    else addMatch(hobbyId, blockId, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{match ? "Modifica partita" : "Nuova partita"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Risultato</p>
            <div className="flex gap-2">
              {RESULT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setResult(o.id)}
                  className="focus-ring rounded-full border px-3.5 py-1.5 text-sm transition"
                  style={{
                    borderColor: result === o.id ? o.color : "rgba(255,255,255,0.1)",
                    background: result === o.id ? `${o.color}22` : "transparent",
                    color: result === o.id ? "#F1F1FA" : "#8B90A8",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Punteggio" value={score} onChange={(e) => setScore(e.target.value)} placeholder="3-1, 21-18..." />
          </div>

          <PersonPicker label="Avversario (se conosciuto)" value={opponentPersonId} options={people} onChange={setOpponentPersonId} />
          <TextField label="Oppure nome libero" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Es. squadra/utente ospite" />

          <TextField label="Torneo/competizione" value={competition} onChange={(e) => setCompetition(e.target.value)} />

          <label className="block">
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Luogo</span>
            <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100">
              <option value="" className="bg-void-800">Nessuno</option>
              {places.map((p) => (
                <option key={p.id} value={p.id} className="bg-void-800">{p.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Ruolo" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Portiere, bianco..." />
            <TextField label="Durata (minuti)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>

          <TextArea label="Note tattiche" value={note} onChange={(e) => setNote(e.target.value)} />

          <ImageCropInput
            shape="square"
            onChange={(key) => setPhotoKey(key)}
            trigger={(open) => (
              <button type="button" onClick={open} className="focus-ring flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 hover:border-aura-violet/50" aria-label="Foto/screenshot">
                {photoKey ? <PhotoPreview photoKey={photoKey} /> : <ImagePlus size={16} />}
              </button>
            )}
          />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {match && (
              <Button variant="danger" onClick={() => { removeMatch(hobbyId, blockId, match.id); onClose(); }} aria-label="Elimina">
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit}>
              {match ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
