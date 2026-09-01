"use client";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { motion } from "framer-motion";
import { PlaceType, CustomField } from "@/lib/types";
import { PLACE_TYPE_META, PLACE_TYPES } from "@/lib/places-meta";
import { capitalizeWords } from "@/lib/text";
import { newId } from "@/lib/id";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { useFeed } from "@/lib/feed-context";
import { useMood } from "@/lib/mood-context";
import { AddressSuggestion } from "@/lib/geocode";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ImageCropInput } from "../ui/ImageCropInput";
import { AddressAutocomplete } from "../ui/AddressAutocomplete";
import { MapView } from "./MapView";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";
import { useMapAddressPick } from "@/lib/use-map-address-pick";

export function AddPlaceModal({
  onClose,
  initialName = "",
  initialAddress = "",
  initialType = "ristorante",
}: {
  onClose: () => void;
  initialName?: string;
  initialAddress?: string;
  initialType?: PlaceType;
}) {
  const { addPlace, places } = usePlaces();
  const { people, home, updatePerson } = useHousehold();
  const { profile, updateProfile } = useProfile();
  const { pushEvent } = useFeed();
  const { fireTrigger } = useMood();

  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [type, setType] = useState<PlaceType>(initialType);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [linkedPersonId, setLinkedPersonId] = useState<string>("user");

  const needsOwner = type === "casa" || type === "lavoro";
  const center = coords || (home ? { lat: home.lat, lng: home.lng } : DEFAULT_MAP_CENTER);
  const { onPick: onMapPick, resolving: resolvingAddress } = useMapAddressPick(address, setAddress, setCoords);

  const onPickAddress = (s: AddressSuggestion) => {
    setAddress(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
  };

  const submit = () => {
    if (!address.trim() || !coords) return;
    const finalName = name.trim() ? capitalizeWords(name.trim()) : capitalizeWords(address.trim());
    const isPrimaryHome =
      type === "casa" && linkedPersonId === "user" && !places.some((p) => p.isPrimaryHome);

    addPlace({
      name: finalName,
      photoUrl: photo,
      type,
      address: address.trim(),
      lat: coords.lat,
      lng: coords.lng,
      linkedPersonId: needsOwner ? linkedPersonId : undefined,
      isPrimaryHome,
    });
    fireTrigger("luogo:nuovo");

    if (type === "lavoro" && linkedPersonId === "user" && !profile.currentWorkplace) {
      updateProfile({ currentWorkplace: finalName });
    }

    if (needsOwner && linkedPersonId !== "user") {
      const person = people.find((p) => p.id === linkedPersonId);
      if (person) {
        const label = type === "casa" ? "Abita a" : "Lavora Presso";
        const field: CustomField = { id: newId(), label, value: finalName };
        if (type === "casa") {
          updatePerson(person.id, { homeCustomFields: [...person.homeCustomFields, field] });
        } else {
          updatePerson(person.id, { eduWorkCustomFields: [...person.eduWorkCustomFields, field] });
        }
        pushEvent(`Hai scoperto qualcosa di nuovo su ${person.firstName} ${person.lastName}: ${label} — ${finalName}`);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Aggiungi luogo</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {PLACE_TYPES.map((t) => {
              const meta = PLACE_TYPE_META[t];
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all"
                  style={{
                    borderColor: type === t ? meta.color : "rgba(255,255,255,0.1)",
                    background: type === t ? `${meta.color}22` : "transparent",
                    color: type === t ? "#F1F1FA" : "#8B90A8",
                  }}
                >
                  <Icon size={13} /> {meta.label}
                </button>
              );
            })}
          </div>

          <TextField
            label="Rinomina luogo (facoltativo)"
            placeholder="Es. Il Nostro Posto Preferito"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <AddressAutocomplete label="Indirizzo" value={address} onChange={setAddress} onSelect={onPickAddress} />

          <ImageCropInput
            shape="square"
            onChange={(url) => setPhoto(url)}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="focus-ring flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-600 hover:text-ink-200"
              >
                <ImagePlus size={14} />
                {photo ? "Foto selezionata (tocca per ricentrare)" : "Aggiungi Foto (Facoltativo)"}
              </button>
            )}
          />

          {needsOwner && (
            <label className="block">
              <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                {type === "casa" ? "A chi appartiene" : "Chi Lavora Qui"}
              </span>
              <select
                value={linkedPersonId}
                onChange={(e) => setLinkedPersonId(e.target.value)}
                className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
              >
                <option value="user" className="bg-void-800">
                  Io
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id} className="bg-void-800">
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                Posizione sulla mappa
              </span>
              <span className="text-[11px] text-ink-800">
                {resolvingAddress ? "Sto cercando l'indirizzo…" : coords ? "Tocca per rifinire" : "Tocca Per Segnare Il Punto Esatto"}
              </span>
            </div>
            <div className="h-40 overflow-hidden rounded-xl2 border border-white/10">
              <MapView
                places={[]}
                center={center}
                pickMode
                onPick={onMapPick}
                draftMarker={coords}
                showUserLocation
              />
            </div>
            {!coords && (
              <p className="mt-1.5 text-[10px] text-ink-800">
                Non Serve Un Indirizzo Suggerito: Puoi Segnare Il Punto Direttamente Sulla Mappa,
                Anche Per Un Numero Civico Che Non Compare Nei Suggerimenti.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button
            className="w-full justify-center"
            onClick={submit}
            disabled={!address.trim() || !coords}
          >
            Aggiungi luogo
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
