"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { useHousehold } from "@/lib/household-context";
import { LibraryItem, LibraryStatus } from "@/lib/hobby-types";
import { TextField, TextArea } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { StarRating } from "./StarRating";
import { PersonPicker } from "../ui/PersonPicker";
import { ImageCropInput } from "../ui/ImageCropInput";
import { useResolvedImage } from "@/lib/use-resolved-image";

const STATUS_OPTIONS: { id: LibraryStatus; label: string }[] = [
  { id: "da-provare", label: "Da provare" },
  { id: "in-corso", label: "In corso" },
  { id: "completato", label: "Completato" },
  { id: "abbandonato", label: "Abbandonato" },
];

function CoverPreview({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function LibraryItemModal({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item?: LibraryItem;
  onClose: () => void;
}) {
  const { addLibraryItem, updateLibraryItem, removeLibraryItem } = useHobby();
  const { people } = useHousehold();

  const [title, setTitle] = useState(item?.title ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(item?.photoKey);
  const [creator, setCreator] = useState(item?.creator ?? "");
  const [startedDate, setStartedDate] = useState(item?.startedDate ?? "");
  const [completedDate, setCompletedDate] = useState(item?.completedDate ?? "");
  const [status, setStatus] = useState<LibraryStatus>(item?.status ?? "da-provare");
  const [rating, setRating] = useState<number | undefined>(item?.rating);
  const [review, setReview] = useState(item?.review ?? "");
  const [genre, setGenre] = useState(item?.genre ?? "");
  const [length, setLength] = useState(item?.length ?? "");
  const [rewatchCount, setRewatchCount] = useState(String(item?.rewatchCount ?? 0));
  const [recommendedByPersonId, setRecommendedByPersonId] = useState<string | undefined>(item?.recommendedByPersonId);

  const canSave = title.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const payload = {
      title: title.trim(),
      photoKey,
      creator: creator.trim() || undefined,
      startedDate: startedDate || undefined,
      completedDate: completedDate || undefined,
      status,
      rating,
      review: review.trim() || undefined,
      genre: genre.trim() || undefined,
      length: length.trim() || undefined,
      rewatchCount: Math.max(0, parseInt(rewatchCount, 10) || 0),
      recommendedByPersonId,
    };
    if (item) updateLibraryItem(hobbyId, blockId, item.id, payload);
    else addLibraryItem(hobbyId, blockId, payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{item ? "Modifica voce" : "Nuova voce"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <ImageCropInput
              shape="square"
              onChange={(key) => setPhotoKey(key)}
              trigger={(open) => (
                <button type="button" onClick={open} className="focus-ring flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 hover:border-aura-cyan/50" aria-label="Copertina">
                  {photoKey ? <CoverPreview photoKey={photoKey} /> : <ImagePlus size={18} />}
                </button>
              )}
            />
            <div className="min-w-0 flex-1 space-y-3">
              <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="Autore/creatore" value={creator} onChange={(e) => setCreator(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Stato</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={status === o.id} onClick={() => setStatus(o.id)} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Iniziato il" type="date" value={startedDate} onChange={(e) => setStartedDate(e.target.value)} />
            <TextField label="Completato il" type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Genere" value={genre} onChange={(e) => setGenre(e.target.value)} />
            <TextField label="Lunghezza" value={length} onChange={(e) => setLength(e.target.value)} placeholder="320 pagine, 45 min..." />
          </div>

          <StarRating label="Voto" value={rating} onChange={setRating} />

          <TextArea label="Recensione" value={review} onChange={(e) => setReview(e.target.value)} />

          <TextField label="Volte riletto/riguardato" type="number" value={rewatchCount} onChange={(e) => setRewatchCount(e.target.value)} />

          <PersonPicker label="Consigliato da" value={recommendedByPersonId} options={people} onChange={setRecommendedByPersonId} />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {item && (
              <Button variant="danger" onClick={() => { removeLibraryItem(hobbyId, blockId, item.id); onClose(); }} aria-label="Elimina">
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
              {item ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
