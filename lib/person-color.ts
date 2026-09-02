import { TASK_COLORS } from "./task-colors";
import { hashToUnit } from "./hash";

/**
 * Colore identità stabile per persona — stessa palette "gioiello" (angolo aureo) già usata
 * per le Task, derivato dal suo id: sempre lo stesso colore ovunque quella persona compaia,
 * senza doverlo scegliere o salvare a mano. Usato solo per l'alone Aura nei contesti neutri
 * (avatar impilati su Task/Luoghi) — mai per Casa/Fuori Casa/Mondo, che
 * restano i colori di stato già in uso.
 */
export function personColor(personId: string): string {
  const idx = Math.floor(hashToUnit(personId) * TASK_COLORS.length) % TASK_COLORS.length;
  return TASK_COLORS[idx];
}
