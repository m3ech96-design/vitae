export interface Coords {
  lat: number;
  lng: number;
}

/** Distanza in metri tra due coordinate (formula dell'emisenoverso). */
export function distanceMeters(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export const HOME_LEAVE_THRESHOLD_METERS = 100;
export const PLACE_ENTER_THRESHOLD_METERS = 100;
export const PLACE_ICON_CLEAR_THRESHOLD_METERS = 200;

/** Centro di fallback quando non c'è ancora una Casa né una posizione nota: Roma, per
 * restare in Italia senza puntare a un indirizzo reale specifico. */
export const DEFAULT_MAP_CENTER: Coords = { lat: 41.9028, lng: 12.4964 };
