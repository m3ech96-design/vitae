"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ImagePlus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/lib/wishlist-context";
import { usePlaces } from "@/lib/places-context";
import { WishlistItem } from "@/lib/wishlist-types";
import { CustomField } from "@/lib/types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { DynamicFieldList } from "../wizard/DynamicFieldList";
import { useResolvedImage } from "@/lib/use-resolved-image";

function PhotoPreview({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function AddWishlistItemModal({ item, onClose }: { item?: WishlistItem; onClose: () => void }) {
  const { addItem, updateItem } = useWishlist();
  const { places } = usePlaces();

  const [name, setName] = useState(item?.name ?? "");
  const [photoKey, setPhotoKey] = useState<string | undefined>(item?.photoKey);
  const [details, setDetails] = useState<CustomField[]>(item?.details ?? []);
  const [linkedPlaceId, setLinkedPlaceId] = useState(item?.linkedPlaceId ?? "");
  const [row, setRow] = useState(item?.row ?? "");
  const [aisle, setAisle] = useState(item?.aisle ?? "");
  const [shelfNumber, setShelfNumber] = useState(item?.shelfNumber ?? "");
  const [shelf, setShelf] = useState(item?.shelf ?? "");
  const [siteName, setSiteName] = useState(item?.siteName ?? "");
  const [siteUrl, setSiteUrl] = useState(item?.siteUrl ?? "");
  const [price, setPrice] = useState(item?.price !== null && item?.price !== undefined ? String(item.price) : "");
  const [estimatedPeriod, setEstimatedPeriod] = useState(item?.estimatedPeriod ?? "");

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      photoKey,
      details,
      linkedPlaceId: linkedPlaceId || undefined,
      row: row.trim() || undefined,
      aisle: aisle.trim() || undefined,
      shelfNumber: shelfNumber.trim() || undefined,
      shelf: shelf.trim() || undefined,
      siteName: siteName.trim() || undefined,
      siteUrl: siteUrl.trim() || undefined,
      price: price.trim() ? Math.max(0, parseFloat(price.replace(",", "."))) : null,
      estimatedPeriod: estimatedPeriod.trim() || undefined,
    };
    if (item) updateItem(item.id, payload);
    else addItem(payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{item ? "Modifica articolo" : "Nuovo articolo"}</p>
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
                  className="focus-ring flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-pink/50"
                  aria-label="Foto dell'articolo"
                >
                  {photoKey ? <PhotoPreview photoKey={photoKey} /> : <ImagePlus size={20} />}
                </button>
              )}
            />
            <div className="min-w-0 flex-1">
              <TextField label="Nome dell'articolo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Cuffie wireless" />
            </div>
          </div>

          <TextField label="Prezzo (€)" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nome del sito" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Es. Amazon" />
            <TextField label="URL" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://..." />
          </div>

          <TextField
            label="Periodo stimato di acquisto"
            value={estimatedPeriod}
            onChange={(e) => setEstimatedPeriod(e.target.value)}
            placeholder="Es. a Natale, tra 2-3 mesi..."
          />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Dove si trova</p>
            <select
              value={linkedPlaceId}
              onChange={(e) => setLinkedPlaceId(e.target.value)}
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
            >
              <option value="" className="bg-void-800">
                Nessun luogo collegato
              </option>
              {places.map((p) => (
                <option key={p.id} value={p.id} className="bg-void-800">
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-ink-800">Non trovi il negozio? Aggiungilo prima dalla scheda Mappa.</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <TextField label="Fila" value={row} onChange={(e) => setRow(e.target.value)} />
              <TextField label="Corsia" value={aisle} onChange={(e) => setAisle(e.target.value)} />
              <TextField label="Numero" value={shelfNumber} onChange={(e) => setShelfNumber(e.target.value)} />
              <TextField label="Scaffale" value={shelf} onChange={(e) => setShelf(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Altri dettagli</p>
            <DynamicFieldList fields={details} onChange={setDetails} allowThumbnail addLabel="Aggiungi dettaglio" />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {item ? "Salva modifiche" : "Aggiungi alla wishlist"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
