/**
 * Soglie di riferimento tratte da fonti sanitarie ufficiali (OMS, CREA/Ministero della
 * Salute) — non inventate, ognuna con la propria fonte annotata qui accanto. Questo file
 * NON emette giudizi: è solo il catalogo dei numeri di riferimento, usati poi da
 * wellbeing-report.ts per il confronto. Tenerli qui, separati dalla logica che li usa,
 * rende esplicito quali soglie sono "fatti citabili" e quali (in wellbeing-report.ts) sono
 * scelte di presentazione — una distinzione che conta quando si parla di salute.
 *
 * Fonti:
 * - OMS 2020, "Guidelines on physical activity and sedentary behaviour" (Every Move
 *   Counts): 150-300 min/settimana di attività aerobica moderata, o 75-150 vigorosa, o
 *   combinazione equivalente; rafforzamento muscolare ≥2 giorni/settimana.
 * - OMS, "Healthy diet" fact sheet: zuccheri liberi <10% delle kcal totali (idealmente
 *   <5%), grassi totali <30% delle kcal, sale <5g/giorno, frutta e verdura ≥400g/giorno
 *   (~5 porzioni).
 * - CREA, "Linee guida per una sana alimentazione" (revisione 2018): stessa soglia di 5
 *   porzioni di frutta e verdura al giorno, adottata anche a livello italiano.
 */

/** Minuti di attività aerobica MODERATA equivalenti richiesti a settimana — il minimo
 * della fascia OMS (150), non il massimo (300): il minimo è la soglia sotto la quale l'OMS
 * parla esplicitamente di benefici non ancora raggiunti, il massimo è dove i benefici
 * aggiuntivi iniziano a scemare, non un secondo minimo da pretendere. */
export const WHO_WEEKLY_MODERATE_MINUTES = 150;

/** Sessioni minime di rafforzamento muscolare a settimana (categoria "forza" nel catalogo
 * attività) — raccomandazione OMS valida indipendentemente dai minuti aerobici, le due
 * cose si sommano, non si sostituiscono a vicenda. */
export const WHO_WEEKLY_STRENGTH_SESSIONS = 2;

/** Percentuale massima di calorie giornaliere da zuccheri liberi — 10% è la soglia OMS
 * "forte", 5% quella "condizionale" con benefici aggiuntivi. Usiamo 10% come soglia di
 * valutazione (quella con l'evidenza più solida), citando comunque il 5% come traguardo
 * successivo dove pertinente. */
export const WHO_MAX_SUGAR_PERCENT_OF_KCAL = 10;

/** Grammi massimi di sale al giorno raccomandati dall'OMS. */
export const WHO_MAX_SALT_GRAMS_PER_DAY = 5;

/** Percentuale massima di calorie giornaliere da grassi totali. */
export const WHO_MAX_FAT_PERCENT_OF_KCAL = 30;

/** Porzioni minime di frutta e verdura al giorno — stessa soglia OMS e CREA. */
export const RECOMMENDED_FRUIT_VEG_PORTIONS_PER_DAY = 5;

/** Litri d'acqua indicativi al giorno — una cifra generica di larga diffusione (non
 * un'unica soglia OMS specifica come le altre: il fabbisogno idrico varia molto per
 * clima, corporatura e attività), usata qui come riferimento di massima, non come soglia
 * clinica rigida al pari delle altre. */
export const INDICATIVE_DAILY_WATER_LITERS = 2;

/** kcal bruciate camminando per kg di peso corporeo per km percorso — formula di Margaria,
 * lo standard più citato per questa stima. Serve solo per tradurre calorie bruciate in
 * "km equivalenti a piedi" nelle curiosità (vedi wellbeing-curiosities.ts), non per
 * calcolare le calorie di un allenamento (quelle restano quelle inserite dall'utente o
 * stimate dal MET dell'attività specifica, molto più accurate di questa media generica). */
export const WALKING_KCAL_PER_KG_PER_KM = 0.5;

/** Quota di adulti nel mondo che, secondo l'OMS, non raggiunge i livelli minimi di
 * attività fisica raccomandati — statistica citata nel materiale divulgativo OMS
 * sull'attività fisica, usata solo per una curiosità di confronto (vedi
 * populationComparisonCuriosity in wellbeing-curiosities.ts), non per alcun calcolo. */
export const WHO_GLOBAL_INACTIVITY_SHARE = 0.25;
