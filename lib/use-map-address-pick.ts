"use client";
import { useState } from "react";
import { reverseGeocode } from "./geocode";

function formatCoordsFallback(lat: number, lng: number) {
  return `Punto Selezionato (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

/**
 * Gestisce il tocco diretto sulla mappa per scegliere un punto, condiviso tra "Aggiungi
 * Luogo" e "Collega La Tua Casa": imposta subito le coordinate, e se il campo Indirizzo è
 * ancora vuoto prova a risalire a un indirizzo leggibile (Nominatim, reverse geocoding).
 *
 * Se il campo ha già del testo — scritto a mano o arrivato da un suggerimento — non lo
 * tocca: resta valido il principio già in uso nell'app, il testo scritto è sempre la fonte
 * di verità. Se la ricerca fallisce (rete, punto senza indirizzo noto), scrive le
 * coordinate stesse come testo di ripiego, così il campo non resta mai vuoto e il pulsante
 * di conferma non resta bloccato senza una spiegazione visibile.
 */
export function useMapAddressPick(
  address: string,
  setAddress: (v: string) => void,
  setCoords: (c: { lat: number; lng: number }) => void
) {
  const [resolving, setResolving] = useState(false);

  const onPick = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    if (address.trim()) return;
    setResolving(true);
    const label = await reverseGeocode(lat, lng);
    setAddress(label || formatCoordsFallback(lat, lng));
    setResolving(false);
  };

  return { onPick, resolving };
}
