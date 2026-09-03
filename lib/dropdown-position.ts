/**
 * Il bug corretto qui riguardava allo stesso modo cinque menu diversi dell'app (Bisogni/Stati
 * D'animo in Home, Aggiungi in Famiglia, il menu dei tre puntini di un post, il selettore
 * stato d'animo, il suggerimento "non conosci ancora questa persona"): ognuno calcolava la
 * propria posizione come "subito sotto il pulsante", senza mai controllare se lì sotto
 * restasse davvero spazio prima del fondo dello schermo. Quando il pulsante si trovava nella
 * parte bassa di una pagina già arrivata al suo scroll massimo, il menu restava visibile solo
 * in parte — oltre il bordo dello schermo, non recuperabile scorrendo, perché la pagina non
 * aveva più margine di scroll da dare.
 *
 * Questa funzione decide se aprire verso il basso (come sempre) o verso l'alto (quando sotto
 * non c'entra), usando un'altezza STIMATA per eccesso passata da chi la chiama — ogni menu
 * conosce già la propria altezza massima plausibile (quante voci ha, o un tetto già impostato
 * come `max-h`) meglio di una misura generica a runtime, ed è un conto sufficiente: l'obiettivo
 * è non tagliare mai il menu, non trovare il pixel esatto.
 */
export function flippedMenuTop(
  triggerRect: { top: number; bottom: number },
  estimatedMenuHeight: number,
  gap = 8
): number {
  const fitsBelow = triggerRect.bottom + gap + estimatedMenuHeight <= window.innerHeight - gap;
  return fitsBelow ? triggerRect.bottom + gap : Math.max(gap, triggerRect.top - estimatedMenuHeight - gap);
}
