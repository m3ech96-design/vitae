import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { Place, PlaceType } from "@/lib/types";
import { PLACE_TYPES } from "@/lib/places-meta";
import { searchAddress } from "@/lib/geocode";

interface PlacesCtx {
  places: Place[];
  addPlace: (input: { name: string; type: PlaceType; address: string; lat: number; lng: number }) => Place;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  removePlace: (id: string) => void;
  setRating: (id: string, rating: number) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string, withPersonIds: string[]) => { promptRating: boolean; askSpent: boolean };
}

function placesCtx(ctx: TiberExecutionContext): PlacesCtx {
  return ctxField<PlacesCtx>(ctx, "places");
}

function findPlaceByName(places: Place[], name: string): Place | undefined {
  const needle = name.trim().toLowerCase();
  return (
    places.find((p) => p.name.trim().toLowerCase() === needle) ??
    places.find((p) => p.name.trim().toLowerCase().includes(needle))
  );
}

export const placesTools: Record<string, TiberToolDefinition> = {
  crea_luogo: {
    declaration: {
      name: "crea_luogo",
      description: "Salva un nuovo luogo in Mappa, geocodificando l'indirizzo indicato.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome del luogo." },
          address: { type: "STRING", description: "Indirizzo o nome del posto da geocodificare (es. 'Piazza Duomo, Milano')." },
          type: { type: "STRING", enum: PLACE_TYPES, description: "Tipo di luogo." },
        },
        required: ["name", "address", "type"],
      },
    },
    execute: async (args, ctx) => {
      const { addPlace } = placesCtx(ctx);
      const results = await searchAddress(String(args.address)).catch(() => []);
      if (results.length === 0) return `Non sono riuscito a geolocalizzare "${args.address}" — prova con un indirizzo più preciso.`;
      const best = results[0];
      addPlace({ name: String(args.name), type: args.type as PlaceType, address: best.label, lat: best.lat, lng: best.lng });
      return `Luogo "${args.name}" salvato in Mappa (${best.label}).`;
    },
  },

  valuta_luogo: {
    declaration: {
      name: "valuta_luogo",
      description: "Imposta la valutazione (1-5) di un luogo già salvato in Mappa, cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome (anche parziale) del luogo." },
          rating: { type: "NUMBER", description: "Valutazione da 1 a 5." },
        },
        required: ["name", "rating"],
      },
    },
    execute: (args, ctx) => {
      const { places, setRating } = placesCtx(ctx);
      const place = findPlaceByName(places, String(args.name));
      if (!place) return `Non ho trovato nessun luogo con nome simile a "${args.name}".`;
      setRating(place.id, Number(args.rating));
      return `Valutazione di "${place.name}" impostata a ${args.rating}.`;
    },
  },

  registra_visita_luogo: {
    declaration: {
      name: "registra_visita_luogo",
      description: "Fa check-in e check-out immediati per un luogo, registrando una visita, cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del luogo visitato." } },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { places, checkIn, checkOut } = placesCtx(ctx);
      const place = findPlaceByName(places, String(args.name));
      if (!place) return `Non ho trovato nessun luogo con nome simile a "${args.name}".`;
      checkIn(place.id);
      checkOut(place.id, []);
      return `Visita a "${place.name}" registrata.`;
    },
  },

  elenca_luoghi: {
    declaration: {
      name: "elenca_luoghi",
      description: "Elenca i luoghi salvati in Mappa, con tipo e valutazione.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { places } = placesCtx(ctx);
      if (places.length === 0) return "Nessun luogo salvato in Mappa.";
      return places.map((p) => `${p.name} (${p.type}${p.rating ? `, ${p.rating}/5` : ""})`).join("; ");
    },
  },

  elimina_luogo: {
    declaration: {
      name: "elimina_luogo",
      description: "Elimina definitivamente un luogo salvato, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) del luogo da eliminare." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { places, removePlace } = placesCtx(ctx);
      const place = findPlaceByName(places, String(args.name));
      if (!place) return `Non ho trovato nessun luogo con nome simile a "${args.name}".`;
      removePlace(place.id);
      return `Luogo "${place.name}" eliminato.`;
    },
  },
};
