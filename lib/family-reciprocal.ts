import { FamilyEntity } from "./family-relations";

function isMale(e?: FamilyEntity) {
  return e?.gender === "Uomo" || e?.gender === "Maschio";
}
function isFemale(e?: FamilyEntity) {
  return e?.gender === "Donna" || e?.gender === "Femmina";
}

function addUnique(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr : [...arr, id];
}

function childrenOf(parentId: string, all: FamilyEntity[]): FamilyEntity[] {
  return all.filter((e) => e.fatherId === parentId || e.motherId === parentId);
}

/**
 * Il bug capitale del vecchio sistema: X sposato con Y, figlio Z — Z risultava figlio solo
 * di X, mai di Y, perché il legame andava dichiarato due volte a mano e quasi mai lo era.
 * Nel nuovo modello non serve dichiararlo due volte: se il genitore che stai impostando ha
 * un coniuge/partner, e l'altro genitore di questo figlio è ancora vuoto, lo riempie da solo
 * con lui — in entrambe le direzioni (che tu stia aggiungendo il figlio a un genitore già
 * sposato, o sposando qualcuno dopo aver già registrato i figli).
 */
function coParentId(parent: FamilyEntity | undefined): string | undefined {
  return parent?.spouseId || parent?.partnerPersonId;
}

/**
 * Calcola cosa impostare anche sull'altro lato quando modifichi i legami diretti di una
 * persona — così l'albero resta coerente in ogni direzione senza ripetere un collegamento
 * due volte. Copre: coniuge/partner/ex coniugi (simmetrici per definizione, stesso campo su
 * entrambi i lati) e, quando imposti un genitore, il completamento automatico dell'altro
 * genitore dal coniuge — sia sul figlio che stai modificando ora, sia su tutti i suoi
 * fratelli già registrati che avevano lo stesso buco.
 */
export function computeReciprocalWrites(
  focus: FamilyEntity,
  patch: Partial<FamilyEntity>,
  byId: Map<string, FamilyEntity>,
  all: FamilyEntity[]
): { id: string; patch: Partial<FamilyEntity> }[] {
  const writes: { id: string; patch: Partial<FamilyEntity> }[] = [];

  (["spouseId", "partnerPersonId"] as const).forEach((field) => {
    if (!(field in patch)) return;
    const newVal = patch[field];
    if (!newVal) return;
    const target = byId.get(newVal);
    if (target && target[field] !== focus.id) {
      writes.push({ id: newVal, patch: { [field]: focus.id } });
    }
    // Tutti i figli già registrati di focus che aspettavano ancora l'altro genitore lo
    // ricevono ora, senza dover essere toccati uno per uno a mano — solo se il genere del
    // nuovo coniuge/partner è coerente col ruolo mancante: altrimenti è meglio lasciarlo
    // vuoto che indovinare male per un genere non binario o una coppia dello stesso sesso.
    const newSpouse = byId.get(newVal);
    const missingParentField = isMale(focus) && isFemale(newSpouse) ? "motherId" : isFemale(focus) && isMale(newSpouse) ? "fatherId" : null;
    if (missingParentField) {
      childrenOf(focus.id, all).forEach((child) => {
        if (!child[missingParentField]) {
          writes.push({ id: child.id, patch: { [missingParentField]: newVal } });
        }
      });
    }
  });

  if ("exSpouseIds" in patch) {
    const oldArr = focus.exSpouseIds || [];
    const newArr = patch.exSpouseIds || [];
    newArr
      .filter((x) => !oldArr.includes(x))
      .forEach((targetId) => {
        const target = byId.get(targetId);
        if (!target) return;
        writes.push({ id: targetId, patch: { exSpouseIds: addUnique(target.exSpouseIds || [], focus.id) } });
      });
  }

  return writes;
}

/**
 * Quando imposti un genitore di `focus` (Padre o Madre), e quel genitore ha già un
 * coniuge/partner, riempie da solo anche l'altro genitore — invece di lasciare `focus`
 * figlio di uno solo dei due finché qualcuno non lo dichiara a mano dall'altro lato. Va
 * applicato al patch PRIMA di scriverlo (stesso record, nessuna scrittura incrociata).
 */
export function enrichParentPatch(
  focus: FamilyEntity,
  patch: Partial<FamilyEntity>,
  byId: Map<string, FamilyEntity>
): Partial<FamilyEntity> {
  const enriched: Partial<FamilyEntity> = { ...patch };

  if ("fatherId" in patch && patch.fatherId) {
    const resultingMother = "motherId" in patch ? patch.motherId : focus.motherId;
    if (!resultingMother) {
      const co = coParentId(byId.get(patch.fatherId));
      if (co && isFemale(byId.get(co))) enriched.motherId = co;
    }
  }
  if ("motherId" in patch && patch.motherId) {
    const resultingFather = "fatherId" in patch ? patch.fatherId : focus.fatherId;
    if (!resultingFather) {
      const co = coParentId(byId.get(patch.motherId));
      if (co && isMale(byId.get(co))) enriched.fatherId = co;
    }
  }

  return enriched;
}
