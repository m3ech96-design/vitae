"use client";
import { useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { Hobby } from "@/lib/hobby-types";
import { CustomField } from "@/lib/types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { DynamicFieldList } from "../wizard/DynamicFieldList";
import { useResolvedImage } from "@/lib/use-resolved-image";

function CoverPreview({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function AddHobbyModal({ hobby, onClose }: { hobby?: Hobby; onClose: () => void }) {
  const { addHobby, updateHobby } = useHobby();
  const [name, setName] = useState(hobby?.name ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(hobby?.photoKey);
  const [details, setDetails] = useState<CustomField[]>(hobby?.details ?? []);

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    if (hobby) updateHobby(hobby.id, { name: name.trim(), photoKey, details });
    else addHobby({ name: name.trim(), photoKey, details });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{hobby ? "Modifica hobby" : "Nuovo hobby"}</p>
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
                <button
                  type="button"
                  onClick={open}
                  className="focus-ring flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-violet/50"
                  aria-label="Foto dell'hobby"
                >
                  {photoKey ? <CoverPreview photoKey={photoKey} /> : <ImagePlus size={20} />}
                </button>
              )}
            />
            <div className="min-w-0 flex-1">
              <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Corsa, Modellismo, Chitarra..." />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Dettagli</p>
            <DynamicFieldList fields={details} onChange={setDetails} allowThumbnail addLabel="Aggiungi dettaglio" />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {hobby ? "Salva modifiche" : "Crea hobby"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
