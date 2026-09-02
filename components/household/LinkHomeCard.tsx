"use client";
import { useState } from "react";
import { Home, MapPin } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { usePlaces } from "@/lib/places-context";
import { AddressSuggestion } from "@/lib/geocode";
import { GlassCard } from "../ui/GlassCard";
import { AddressAutocomplete } from "../ui/AddressAutocomplete";
import { Button } from "../ui/Button";
import { MapView } from "../map/MapView";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";
import { useMapAddressPick } from "@/lib/use-map-address-pick";

/**
 * Ordine invertito rispetto a un form qualunque: prima il punto sulla mappa (il modo più
 * naturale per dire "abito qui", specie la prima volta che apri l'app — probabilmente sei
 * proprio a casa mentre lo fai), poi l'indirizzo compare come conferma già scritta (reverse
 * geocoding), non come primo campo da compilare a mente prima di poter fare qualunque cosa.
 * Chi preferisce cercare l'indirizzo può comunque farlo, ma è il ripiego, non il punto di
 * partenza.
 */
export function LinkHomeCard() {
  const { profile } = useProfile();
  const { addPlace } = usePlaces();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const center = coords || DEFAULT_MAP_CENTER;
  const { onPick: onMapPick, resolving: resolvingAddress } = useMapAddressPick(address, setAddress, setCoords);

  const confirm = () => {
    if (!coords || !address.trim()) return;
    addPlace({
      name: `Casa di ${profile.firstName || "utente"}`,
      type: "casa",
      address: address.trim(),
      lat: coords.lat,
      lng: coords.lng,
      linkedPersonId: "user",
      isPrimaryHome: true,
    });
  };

  return (
    <GlassCard glow="violet" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Home size={16} className="text-aura-violet" />
        <p className="font-display text-sm text-ink-100">Collega la tua casa</p>
      </div>
      <p className="mb-4 text-sm text-ink-600">
        Serve una volta sola: da qui in poi l&apos;app riconosce quando sei in casa o fuori.
      </p>

      <div className="space-y-3">
        <div className="relative h-60 overflow-hidden rounded-xl2 border border-white/10">
          <MapView
            places={[]}
            center={center}
            pickMode
            onPick={onMapPick}
            draftMarker={coords}
            showUserLocation
            recenterOnUserLocation={!coords}
          />
          {!coords && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3">
              <span className="glass-strong flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-ink-100">
                <MapPin size={13} className="text-aura-violet" /> Tocca dove abiti
              </span>
            </div>
          )}
        </div>

        {coords && (
          <div>
            <AddressAutocomplete
              label={resolvingAddress ? "Indirizzo (sto cercando…)" : "Conferma l'indirizzo"}
              placeholder="Es. Via Roma 12, Milano"
              value={address}
              onChange={setAddress}
              onSelect={(s: AddressSuggestion) => {
                setCoords({ lat: s.lat, lng: s.lng });
                setAddress(s.label);
              }}
            />
            <p className="mt-1.5 text-[10px] text-ink-800">
              Scritto da solo in base al punto toccato — correggilo pure, specie per il numero
              civico, e resta comunque il punto sulla mappa a contare per davvero.
            </p>
          </div>
        )}

        {!coords && (
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="focus-ring text-[11px] text-ink-800 hover:text-ink-400"
          >
            {searchOpen ? "Nascondi ricerca indirizzo" : "Preferisci cercare l'indirizzo invece?"}
          </button>
        )}

        {!coords && searchOpen && (
          <AddressAutocomplete
            label="Indirizzo"
            placeholder="Es. Via Roma 12, Milano"
            value={address}
            onChange={setAddress}
            onSelect={(s: AddressSuggestion) => {
              setCoords({ lat: s.lat, lng: s.lng });
              setAddress(s.label);
            }}
          />
        )}

        <Button className="w-full justify-center" onClick={confirm} disabled={!coords || !address.trim()}>
          Conferma casa
        </Button>
      </div>
    </GlassCard>
  );
}
