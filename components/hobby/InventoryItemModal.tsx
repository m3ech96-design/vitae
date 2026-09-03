"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { InventoryItem } from "@/lib/hobby-types";
import { CustomField } from "@/lib/types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";
import { MultiPhotoPicker } from "./MultiPhotoPicker";
import { DynamicFieldList } from "../wizard/DynamicFieldList";

export function InventoryItemModal({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item?: InventoryItem;
  onClose: () => void;
}) {
  const { addInventoryItem, updateInventoryItem, removeInventoryItem } = useHobby();

  const [name, setName] = useState(item?.name ?? "");
  const [photoKeys, setPhotoKeys] = useState<string[]>(item?.photoKeys ?? []);
  const [category, setCategory] = useState(item?.category ?? "");
  const [acquiredDate, setAcquiredDate] = useState(item?.acquiredDate ?? "");
  const [source, setSource] = useState(item?.source ?? "");
  const [pricePaid, setPricePaid] = useState(item?.pricePaid !== undefined ? String(item.pricePaid) : "");
  const [estimatedValue, setEstimatedValue] = useState(item?.estimatedValue !== undefined ? String(item.estimatedValue) : "");
  const [condition, setCondition] = useState(item?.condition ?? "");
  const [catalogNumber, setCatalogNumber] = useState(item?.catalogNumber ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [forTrade, setForTrade] = useState(item?.forTrade ?? false);
  const [details, setDetails] = useState<CustomField[]>(item?.details ?? []);

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      photoKeys,
      category: category.trim() || undefined,
      acquiredDate: acquiredDate || undefined,
      source: source.trim() || undefined,
      pricePaid: pricePaid.trim() ? Math.max(0, parseFloat(pricePaid.replace(",", "."))) : undefined,
      estimatedValue: estimatedValue.trim() ? Math.max(0, parseFloat(estimatedValue.replace(",", "."))) : undefined,
      condition: condition.trim() || undefined,
      catalogNumber: catalogNumber.trim() || undefined,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      forTrade,
      details,
    };
    if (item) updateInventoryItem(hobbyId, blockId, item.id, payload);
    else addInventoryItem(hobbyId, blockId, payload);
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
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{item ? "Modifica pezzo" : "Nuovo pezzo"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <MultiPhotoPicker label="Foto (fronte/retro, dettagli...)" photoKeys={photoKeys} onChange={setPhotoKeys} />

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
            <TextField label="Quantità" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data acquisizione" type="date" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)} />
            <TextField label="Provenienza" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Mercatino, negozio..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prezzo pagato (€)" type="number" inputMode="decimal" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
            <TextField label="Valore stimato oggi (€)" type="number" inputMode="decimal" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Condizione" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Es. Ottima, da restaurare" />
            <TextField label="Numero di catalogo" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-ink-100">In vendita/scambio</span>
            <Switch checked={forTrade} onChange={setForTrade} />
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Altri dettagli</p>
            <DynamicFieldList fields={details} onChange={setDetails} allowThumbnail addLabel="Aggiungi dettaglio" />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {item && (
              <Button variant="danger" onClick={() => { removeInventoryItem(hobbyId, blockId, item.id); onClose(); }} aria-label="Elimina">
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
