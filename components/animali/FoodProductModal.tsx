"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ImagePlus } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { ANIMAL_KINDS, PersonKind } from "@/lib/types";
import { FoodProduct, FoodScope, useAnimalFood } from "@/lib/animal-food-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";

type ScopeKind = "animal" | "animals" | "species";

function PhotoPreview({ imageKey }: { imageKey: string }) {
  const url = useResolvedImage(imageKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

/**
 * Aggiunge o modifica un prodotto cibo. `defaultAnimalId` pre-seleziona lo scope "solo questo
 * animale" quando si apre da dentro la scheda di un animale — resta comunque possibile
 * allargarlo a più animali o a un'intera specie prima di salvare.
 */
export function FoodProductModal({
  product,
  defaultAnimalId,
  onClose,
}: {
  product?: FoodProduct;
  defaultAnimalId?: string;
  onClose: () => void;
}) {
  const { people } = useHousehold();
  const { addProduct, updateProduct } = useAnimalFood();
  const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));

  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [quantity, setQuantity] = useState(product?.quantity ?? "");
  const [imageKey, setImageKey] = useState<string | undefined>(product?.imageKey);
  const [unitsTotal, setUnitsTotal] = useState(String(product?.unitsTotal ?? 1));
  const [portionsPerUnit, setPortionsPerUnit] = useState(String(product?.portionsPerUnit ?? 1));

  const [scopeKind, setScopeKind] = useState<ScopeKind>(product?.scope.type ?? "animal");
  const [animalId, setAnimalId] = useState(
    product?.scope.type === "animal" ? product.scope.animalId : defaultAnimalId ?? animals[0]?.id ?? ""
  );
  const [animalIds, setAnimalIds] = useState<string[]>(
    product?.scope.type === "animals" ? product.scope.animalIds : defaultAnimalId ? [defaultAnimalId] : []
  );
  const [species, setSpecies] = useState<PersonKind>(
    product?.scope.type === "species" ? product.scope.species : ANIMAL_KINDS[0]
  );

  const canSave =
    name.trim().length > 0 &&
    Number(unitsTotal) > 0 &&
    Number(portionsPerUnit) > 0 &&
    (scopeKind === "species" || (scopeKind === "animal" && animalId) || (scopeKind === "animals" && animalIds.length > 0));

  const submit = () => {
    if (!canSave) return;
    const scope: FoodScope =
      scopeKind === "animal"
        ? { type: "animal", animalId }
        : scopeKind === "animals"
          ? { type: "animals", animalIds }
          : { type: "species", species };

    const payload = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      quantity: quantity.trim() || undefined,
      imageKey,
      unitsTotal: Math.max(1, Math.round(Number(unitsTotal))),
      portionsPerUnit: Math.max(1, Math.round(Number(portionsPerUnit))),
      scope,
    };
    if (product) updateProduct(product.id, payload);
    else addProduct(payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{product ? "Modifica prodotto" : "Nuovo prodotto"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <ImageCropInput
              shape="square"
              onChange={(key) => setImageKey(key)}
              trigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="focus-ring flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-cyan/50"
                  aria-label="Foto del prodotto"
                >
                  {imageKey ? <PhotoPreview imageKey={imageKey} /> : <ImagePlus size={20} />}
                </button>
              )}
            />
            <div className="min-w-0 flex-1 space-y-3">
              <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Crocchette Salmone" />
              <TextField label="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Es. Almo Nature" />
            </div>
          </div>

          <TextField
            label="Quantità (descrittiva)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Es. 1,5 kg, oppure 24 lattine da 85 g"
            hint="Solo per ricordartela — il calcolo delle porzioni usa i due campi qui sotto."
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Unità nella confezione"
              type="number"
              inputMode="numeric"
              min={1}
              value={unitsTotal}
              onChange={(e) => setUnitsTotal(e.target.value)}
              hint="1 per un pacco unico, es. crocchette"
            />
            <TextField
              label="Porzioni per unità"
              type="number"
              inputMode="numeric"
              min={1}
              value={portionsPerUnit}
              onChange={(e) => setPortionsPerUnit(e.target.value)}
              hint="Es. 1 porzione per lattina"
            />
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Per chi è questo cibo</p>
            <div className="flex gap-1.5">
              {(
                [
                  { key: "animal", label: "Un animale" },
                  { key: "animals", label: "Più animali" },
                  { key: "species", label: "Una specie" },
                ] as { key: ScopeKind; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setScopeKind(opt.key)}
                  className={`focus-ring flex-1 rounded-full border px-2 py-2 text-xs transition ${
                    scopeKind === opt.key ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {scopeKind === "animal" && (
              <select
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                className="focus-ring mt-3 w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
              >
                {animals.length === 0 && <option value="">Nessun animale in casa</option>}
                {animals.map((a) => (
                  <option key={a.id} value={a.id} className="bg-void-800">
                    {a.firstName}
                  </option>
                ))}
              </select>
            )}

            {scopeKind === "animals" && (
              <div className="mt-3">
                <MultiPersonPicker
                  label="Animali"
                  values={animalIds}
                  options={animals as unknown as { id: string; firstName: string; lastName: string; avatarUrl?: string; kind?: string }[]}
                  onChange={setAnimalIds}
                />
              </div>
            )}

            {scopeKind === "species" && (
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as PersonKind)}
                className="focus-ring mt-3 w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
              >
                {ANIMAL_KINDS.map((k) => (
                  <option key={k} value={k} className="bg-void-800">
                    {k === "cane" ? "Tutti i cani" : "Tutti i gatti"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            {product ? "Salva modifiche" : "Aggiungi prodotto"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
