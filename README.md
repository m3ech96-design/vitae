# Vitae

Prima base del progetto: fondamenta tecniche + Wizard di creazione utente.

## Cosa c'è in questa versione

- Progetto Next.js 14 (App Router) + TypeScript + Tailwind, pronto per Vercel.
- Tema scuro con effetto neon/glow ("Aura"), font Space Grotesk + Manrope + JetBrains Mono.
- PWA installabile (manifest, icone, service worker base) per Android e iOS.
- Wizard di creazione utente completo:
  - Identità: immagine profilo con ritaglio/centratura, nome, cognome, compleanno (età calcolata), sesso, carattere (50 tratti), campi personalizzati illimitati ("+").
  - Istruzione e Lavoro: dove ha studiato/lavorato, titolo di studio, campi personalizzati.
  - Interessi: film, musica, libri, videogiochi (con miniature), cibi preferiti, luoghi d'interesse, campi personalizzati con miniatura facoltativa.
  - "Crea Sezione": permette di aggiungere sezioni interamente personalizzate, sempre disponibile in fondo all'ultima sezione, non scompare mai.
- Pagina Home segnaposto con saluto dinamico in base all'orario e riepilogo del profilo.
- Home reale con i riquadri "Casa" e "Fuori Casa":
  - collegamento della Casa a un indirizzo reale (con acquisizione delle coordinate GPS);
  - "Aggiungi Alla Casa" per creare Uomo, Donna, Bambino, Bambina, Cane o Gatto (identità essenziale,
    come da meccanica di scoperta progressiva — il resto delle informazioni arriverà con il modulo Persone);
  - rilevamento posizione facoltativo (l'utente lo attiva lui): se ti allontani più di 500 metri
    da Casa, il tuo avatar passa automaticamente nel riquadro "Fuori Casa" — funziona finché l'app
    resta aperta, per i limiti delle web app spiegati più sotto;
  - le persone/animali "dormono" (icona Zzz) tra le 22:00 e le 6:00: toccarli li sveglia per un'ora;
  - Finestra Persona di base, con le sezioni Scoperte / Impegni / Albero Genealogico segnate
    "Presto" in attesa del modulo Persone completo.
- I dati sono salvati in locale (localStorage), sul dispositivo: per scelta, non è previsto un database.
  Se in futuro servirà sincronizzare i dati tra più dispositivi, si affronterà quando richiesto.

- Mappa interattiva reale (OpenStreetMap con tema scuro CARTO Dark Matter), con marker "Aura":
  glow a diamante viola per Casa, glow a cerchio colorato per ogni altro tipo (Lavoro, Palestra,
  Ristorante, Bar, Supermercato, Negozio, Culto, Servizio, Altro).
  - "Aggiungi Luogo": tipo, foto facoltativa, indirizzo, posizione (GPS o tocco diretto sulla
    mappa); per Casa/Lavoro chiede a chi appartiene tra le persone già create.
  - Check-in/check-out manuale ("Sono Qui" / "Esci Da Qui") con richiesta di eventuali
    accompagnatori; se resti almeno 5 minuti, alla fine ti chiede una valutazione.
  - Valutazione a barra (Pessimo → Adoro) con incrementi del 5–10% a ogni interazione, come da
    meccanica richiesta — semplificata rispetto ai 100 tipi di interazione descritti, che
    aggiungeremo quando costruiremo il modulo Rapporti (la stessa barra verrà riusata lì).
  - Conteggio visite settimana/mese/anno/sempre, cronologia con gli accompagnatori, filtri per
    valutazione e numero di visite; il luogo in cui ti trovi ora resta sempre primo in lista.
  - La Casa collegata in Home ora è, dietro le quinte, un vero Luogo di tipo Casa: i due moduli
    condividono lo stesso dato, senza doppioni.
- Barra di navigazione inferiore, con Task/Persone/Altro già visibili ma disattivati finché non
  li costruiamo (per farti vedere la struttura finale dell'app fin da ora).

- Modulo Task completo:
  - "Aggiungi Task" con titolo, note, tipo (Attività Quotidiana, Spesa, Appuntamento,
    Promemoria, Obiettivo, Evento), data/orario, ricorrenza, colore (50 toni "gioiello"
    distribuiti con l'angolo aureo, non la solita ruota arcobaleno), priorità (con una
    sfumatura leggera e indipendente sulla card, non invasiva), tag, persone e luogo
    collegati, sub-task indipendenti con data/ora proprie.
  - Le Attività Quotidiane si aggregano da sole in una fila dedicata, spuntabili con un tocco;
    dalla seconda volta consecutiva compare la striscia (contatore a fiamma).
  - "Spesa" aggiunge la Lista Della Spesa in fase di creazione; al completamento chiede quanto
    hai speso (facoltativo) — il dato resta pronto per la futura scheda Finanze.
  - Completare una task collegata a un luogo aggiunge automaticamente +1 alle sue visite;
    completarla con altre persone aumenta il loro contatore di frequentazione (base per la
    futura scheda Rapporti).
  - Vista Calendario con una striscia di date "Aura" (stesso linguaggio visivo di avatar e
    mappa) che espande davvero le ricorrenze — una task settimanale, ad esempio, compare in
    automatico su tutte le date corrette, non solo su quella di creazione.
  - Task ordinate per scadenza, filtri per tipo.

- Modulo Persone:
  - "Aggiungi Persona" con la sola Identità (nome, cognome, foto facoltativa, tipo — Uomo,
    Donna, Bambino, Bambina, Cane, Gatto), più un interruttore "Vive Con Te" facoltativo.
  - Finestra Persona con la scheda **Scoperte**: le sei sezioni previste (Identità, Istruzione,
    Lavoro, Casa, Corpo, Interessi) più sezioni interamente personalizzabili — esattamente lo
    stesso meccanismo "+" / "Crea Sezione" del wizard utente, riusato qui per coerenza.
  - **Bolla di dialogo viva**: vicino all'avatar (in Home e in Persone) appare una nuvoletta
    fumettistica con effetto macchina da scrivere, che cita a caso una "Frase Ricorrente"
    (Modalità Dialogo) oppure — se è impostata un'azione per l'orario attuale, o casuale —
    "Forse Sta"/"Probabilmente Sta [...]" (Modalità Vivo). Compare e scompare da sola, a
    intervalli casuali, senza mai coprire il resto della card.
  - Icone Chiama e WhatsApp sulla card, che compaiono da sole appena scopri un numero di
    telefono — nessun campo fisso da riempire, coerente con la logica "solo ciò che scopri".
  - Ogni nuova scoperta genera in automatico una voce nella sezione "Novità" della Home
    ("Hai Scoperto Qualcosa Di Nuovo Su ..."), a chiudere il cerchio tra i due moduli.
  - Elenco ordinabile per alfabeto o per frequentazione (le uscite insieme, contate
    automaticamente dal completamento delle Task).
  - Semplificazioni dichiarate: Impegni e Albero Genealogico sono segnati "Presto" (l'infrastruttura
    delle Task è già pronta per diventare la base degli Impegni); Carattere/Valori/Stile Di
    Vita si compilano come Nuova Scoperta libera invece dei menu da ~100 voci ciascuno, per
    restare concreti senza inventare contenuti; gli animali usano per ora le stesse sei
    sezioni delle persone, non ancora quelle dedicate (orari pappa, interessi/abitudini
    specifici) descritte nella richiesta originale.

- Modulo Salute — qui la richiesta era "scatenati senza mai essere scontato", quindi:
  - Niente grafico a barre da app fitness generica. Le attività registrate diventano un
    **Campo Energetico**: una costellazione di orb luminosi (stesso linguaggio "Aura" di
    avatar, mappa e calendario) che fluttuano organicamente, grandi in proporzione alle
    calorie, colorati per categoria. Toccarne uno apre i dettagli.
  - Catalogo di 110 attività fisiche in 10 categorie (Cardio, Forza, Sport Di Squadra,
    Sport Individuali, Outdoor, Acquatici, Mente-Corpo, Danza E Combattimento, Invernali,
    Altro), ciascuna con una stima calorica per minuto suggerita (e sempre modificabile).
  - Peso: un grafico a linea luminosa con area sfumata, obiettivo tratteggiato, e la
    variazione rispetto alla pesata precedente.
  - Statistiche settimanali (minuti, calorie, giorni attivi consecutivi).
  - Nessun finto pulsante "Connetti Fitbit/Garmin/Apple Salute": la sincronizzazione reale
    servirebbe un servizio lato server per gestire le connessioni in sicurezza (coerente con
    la scelta di non avere un database), quindi per ora tutto si registra a mano, in fretta.
- La barra di navigazione ora ha un pannello "Altro" che raccoglie Salute (pronta) insieme a
  Finanze, Rapporti e Animali (ancora "Presto") — invece di continuare ad aggiungere icone
  alla barra principale ogni volta che finisco un modulo.

## Direzione futura: da solo-locale a multi-utente con un server vero

**Importante per chiunque continui questo progetto, non solo una nota di passaggio**: Vitae
non resterà per sempre un'app solo-locale con un solo account reale e degli account
dimostrativi. Un giorno passerà a più persone vere, collegate tra loro da un server vero —
questo cambia come conviene progettare quello che manca ancora, non quello già costruito.

Cosa significa in pratica, da qui in avanti:
- Dove ha senso, i dati scritti oggi in locale vanno pensati già nella forma che un domani
  viaggerà verso quel server, così da spedire quando arriverà, non da ripensare da capo (è
  già così per `PostReport` in `lib/vitaecom-social-types.ts` — le segnalazioni sui post).
- **Nascondere qualcosa dai menu non è mai un controllo d'accesso vero.** La pagina
  `/segnalazioni` (Checkpoint 38) è raggiungibile solo da un pulsante sul tuo profilo, mai
  dalle schede assegnabili della barra di navigazione — ma questo oggi funziona solo perché
  esiste un solo account reale (te). Quando arriveranno account reali multipli, quella
  sezione (e ogni altra riservata a chi amministra, non a chiunque) andrà ristretta per
  davvero lato server, con un vero controllo su chi può vederla — un lavoro suo, da non dare
  per scontato solo perché oggi un link non compare in un menu.
- Il resto dell'app (Mondo, Persone, Vitaecom, Home...) resta pensato per un solo utente
  reale alla volta: quando si parlerà di account multipli veri, andrà deciso insieme cosa
  diventa condiviso tra le persone collegate (es. il riquadro Casa di una famiglia vera) e
  cosa resta privato di ciascuno — non è una scelta da anticipare da soli ora.

## Checkpoint — cose corrette dopo una rilettura del brief originale

- **Title Case ovunque**: il testo scritto dall'utente (titoli task, note, indirizzi, frasi
  ricorrenti, valori delle scoperte) ora rispetta davvero "Tutte le prime lettere devono
  essere maiuscole" — prima alcuni campi usavano solo la maiuscola iniziale di frase.
- **Ritaglio immagine generalizzato**: prima solo l'avatar si poteva ridimensionare per
  centrare il soggetto; ora lo stesso strumento di ritaglio vale anche per le foto dei
  Luoghi e per le miniature di Interessi/Scoperte, come richiesto in generale.
- **Cliccare sull'utente in Home** ora apre davvero un "Resoconto Generale" (profilo, interessi,
  luoghi, persone conosciute, ritmo delle task, salute) — prima mancava del tutto.
- **Il wizard crea marker veri su Mappa**: "Dove Ha Studiato"/"Dove Ha Lavorato" avevano solo
  una scritta rimandata a "dopo"; ora un pulsante "Crea Marker" apre davvero la creazione del
  luogo, con la posizione da scegliere sulla mappa.
- **Mappa e Persone ora si parlano**: collegare un luogo di tipo Casa o Lavoro a una persona
  (non solo a te) genera davvero una voce nelle sue Scoperte, non solo nel luogo.
- **Filtri nella scheda Persone**: oltre all'ordinamento, ora si può filtrare per Persone,
  Animali, In Casa — mancava il "aggiungi dei filtri" esplicitamente richiesto.

## Gap trovato ma non ancora corretto — il prossimo da fare

Il brief dice esplicitamente: tutto ciò che è nella scheda Scoperte di una persona (soprannome,
numero di telefono, luogo di nascita, valori, punti di forza/deboli, paure, ambizioni, stile di
vita, materie/competenze/lingue, occupazione, stress, stato civile, partner, amici, peso,
altezza, obiettivo fisico, categoria preferita...) deve esistere **anche nel wizard dell'utente**,
in aggiunta a quanto già c'è. Per ora il wizard ha solo i campi originariamente descritti; il
resto si può aggiungere solo con il "+" libero. È un lavoro corposo (una ventina di campi, alcuni
con menu dedicati) che merita un turno suo per non essere fatto in fretta.

## Checkpoint 2 — correzione e rilettura accademica

**Corretto**: la regola sul maiuscolo era sbagliata nella versione precedente. Non è Title Case
ovunque: è la prima lettera della frase intera, non di ogni parola. Ho ripristinato la maiuscola
di sola frase per titolo/note della task, sub-task, valore dei campi scoperti, frasi ricorrenti —
cioè tutto ciò che è davvero una frase libera. Ho lasciato il Title Case solo per nomi propri
ed etichette (nome/cognome, titoli di sezione, nomi di luoghi, titoli di film/libri/giochi,
indirizzi, il nome di un campo personalizzato) perché quelli sono nomi, non frasi.

**Trovato e corretto — un meccanismo che avevo implementato solo a metà**: la richiesta "quanto
hai speso" doveva dipendere dal *tipo di luogo* collegato (Ristorante, Bar, Servizio,
Supermercato, Negozio), non dal tipo di task. Prima scattava solo per le task di tipo "Spesa".
Ora scatta per qualunque task completata che sia collegata a uno di quei tipi di luogo — e,
soprattutto, ora scatta anche uscendo manualmente da uno di quei luoghi nella Mappa, anche senza
nessuna task, esattamente come descritto ("o mi ci trovo fisicamente anche senza task").

**Ri-verificato e confermato corretto** (non serviva intervenire, ma l'ho controllato): la
trasparenza PNG è gestita di serie (il ritaglio immagine esporta sempre in PNG, che preserva il
canale alfa); le bolle di dialogo non coprono mai l'avatar o il resto della card; la sovrapposizione
degli avatar nelle task card conta correttamente fino a 3 + "+n"; il ciclo giorno/notte si applica
allo stesso modo sia in Casa che Fuori Casa.

**Semplificazione dichiarata**: se non rinomini un luogo, il suo nome diventa l'indirizzo che hai
digitato — non un vero "nome originale" recuperato da un servizio di mappe, perché non ho una
fonte di dati esterna affidabile per quello.

## Checkpoint 3 — avevi ragione, "mi ci trovo fisicamente anche senza task" non è un pulsante

Rileggendo con più attenzione i punti sulla geolocalizzazione, il testo descrive un meccanismo
preciso che avevo sostituito con qualcosa di più semplice: l'**ingresso** in un luogo deve essere
**automatico** (rilevato dal sistema entro 100 metri, che chiede "Sei Attualmente A [Luogo]?"),
non un pulsante "Sono Qui" premuto dall'utente. L'unica cosa manuale, come dice il testo, è
**l'uscita** (il pulsante "Esci" nella sezione Mappa) — quella l'avevo già fatta giusta.

Corretto ora:
- Con il rilevamento attivo, un banner compare da solo in cima allo schermo — su qualunque
  pagina dell'app — quando sei entro 100 metri da un luogo registrato, chiedendo conferma.
- Se confermi, parte la visita esattamente come per il check-in manuale (stessa logica di
  uscita, valutazione e richiesta di spesa già costruite).
- Compare l'icona del luogo in alto a destra sull'avatar dell'utente (in Home, sia nella card
  profilo che nei riquadri Casa/Fuori Casa) finché non ti allontani di 200 metri — l'icona sparisce,
  ma la visita resta aperta finché non esci manualmente dalla Mappa, come descritto.
- Ho lasciato il pulsante "Sono Qui" manuale come ripiego per quando il rilevamento è spento
  (o il permesso GPS non è concesso), con una didascalia che lo chiarisce.

## Checkpoint 4 — chiuso il gap più grande rimasto

Il wizard utente ora ha, di serie e in aggiunta a quanto già c'era, tutti i campi previsti dalla
scheda Scoperte di una persona:

- **Identità**: + Soprannome, Numero Di Telefono, Luogo Di Nascita, Valori (60 voci, stessa
  meccanica di ricerca del Carattere), Punti Di Forza, Punti Deboli, Paure, Ambizioni, Obiettivi,
  Stile Di Vita (60 voci).
- **Istruzione E Lavoro**: + Materie Conosciute, Competenze, Abilità, Lingue Conosciute (liste
  libere), Occupazione Attuale, Stress (Basso/Medio/Alto), Ambizione Professionale.
- **Corpo** (sezione nuova): Peso — la prima pesata inserita qui diventa automaticamente la prima
  voce della cronologia in Salute, invece di essere un dato isolato — Altezza, Obiettivo Fisico.
- **Casa** (sezione nuova, vita privata — da non confondere con la Casa/Fuori Casa di Home):
  Stato Civile, Partner e Amici scelti tra le persone già create (con un messaggio chiaro se non
  ne hai ancora create nessuna, invece di mostrare un menu vuoto e basta).
- **Interessi**: + Categoria Preferita (60 voci).

Le tre nuove liste da ~60 voci (Valori, Stile Di Vita, Categorie D'Interesse) sono curate a mano,
non le 100 originali richieste per ciascuna — la stessa scelta già fatta per Carattere nella
prima versione del wizard, per restare concreti senza riempire con voci senza qualità.

## Checkpoint 5 — Rapporti, e stavolta niente foglio dal basso

Avevo notato anch'io, quando me l'hai fatto notare: ogni modulo nuovo finiva per essere la
stessa coreografia — tocca, si apre un pannello dal basso, compila, salva. Rapporti rompe
volutamente quello schema:

- **Niente modal per il dettaglio**: aprire una persona in Rapporti porta a una vera pagina
  dedicata (`/rapporti/[id]`), con tanto di pulsante Indietro — non l'ennesimo foglio che
  scivola dall'basso.
- **L'elenco non è un elenco**: è una galleria di medaglioni. L'avatar di ogni persona è
  incorniciato da un alone il cui colore *è* il rapporto (rosso per l'inimicizia, viola per
  l'amicizia, oro per l'Amicizia Suprema, cremisi per l'Inimicizia Suprema) e la cui intensità
  cresce con la forza del legame — non una barra separata accanto a una card generica.
- **Lo spettro Inimicizia↔Amicizia** è una sola barra orizzontale (come richiesto: "complementari
  al 100%"), con l'avatar della persona che galleggia sopra di essa nella posizione esatta,
  invece di un numero o uno slider anonimo.
- **100 interazioni scritte per intero** (50 positive, 50 negative per le persone; 20+20 per gli
  animali, dominio più ristretto per natura), non generiche — frasi come "Le hai fatto una
  sorpresa" o "Hai dimenticato il suo compleanno", non semplici pulsanti + / −.
- **Amicizia e Inimicizia si sbloccano davvero**: raggiunto il 100% di Amicizia, le interazioni
  positive continuano a riempire Vera Amicizia (icona corona); un'interazione negativa intacca
  prima quella, non la barra base, esattamente come descritto — e specularmente per Profonda
  Inimicizia. Amore si sblocca solo se la persona è il Partner scelto nel wizard.

## Checkpoint 6 — Finanze, e stavolta "di più" sul serio

- **Nessun modal, da nessuna parte**: ogni "aggiungi" (spesa in loop, spesa futura, spesa
  singola, nuovo obiettivo, deposito nel salvadanaio) si apre sul posto, dentro la sua
  sezione — lo stesso linguaggio già usato per le sub-task, non l'ennesimo foglio dal basso.
- **L'anello del budget** non è una barra: è un anello luminoso che cambia colore da solo —
  ciano sotto il 70%, ambra in avvicinamento, rosso oltre il budget — con la cifra spesa al
  centro, modificabile toccandola.
- **Il donut delle categorie** si popola da solo aggregando quattro fonti insieme: le task
  completate con spesa registrata, le uscite dai luoghi (Ristorante, Bar, Supermercato,
  Negozio, Servizio) con spesa registrata, le spese singole inserite a mano, e la quota
  mensile delle spese ricorrenti attive — così il totale del mese non è mai un numero isolato
  da reinserire, è già lì.
- **Gli obiettivi di risparmio** sono boccette che si riempiono di luce, non barre di
  progresso — oro quando li raggiungi.
- **Indice Di Risparmio** e **Risparmio Del Mese** calcolati sul budget impostato, aggiornati
  in automatico ogni volta che qualcosa viene speso altrove nell'app.
- Le "Spese Singole" restano distinte da quelle raccolte in automatico, con una riga che lo
  spiega, così non sembra che manchino dati: semplicemente vivono altrove, alla fonte.

## Checkpoint 7 — tutte le correzioni segnalate, completate

- **Notch**: ogni pagina principale e l'header della Mappa rispettano `env(safe-area-inset-top)`.
- **"Aggiungi Luogo"** non è più coperto dalla mappa (mancava lo z-index sull'overlay).
- **Card profilo in Home**: solo nome, età, icona modifica — via i tratti caratteriali.
- **Risparmi**: niente più segno "meno" da digitare (introvabile sul tastierino numerico
  iOS) — un interruttore Deposita/Preleva esplicito.
- **Dialoghi e Azioni separati per davvero**: la nuvoletta mostra solo le Frasi Ricorrenti,
  ancorata correttamente (`bottom-full` invece del calcolo che si tagliava); le Azioni sono
  ora una riga di testo in corsivo dentro la card, con dissolvenza incrociata — mai più nella
  nuvoletta, mai più sovrapposte a nulla.
- **Home ripulita**: niente più nuvolette né Azioni nei riquadri Casa/Fuori Casa (il problema
  era `overflow-hidden` sulle GlassCard, che le tagliava): lo spazio resta pronto per "Ho Fame"
  degli animali, che arriverà con il modulo Animali, con un badge piccolo come lo Zzz — non una
  nuvoletta che rischierebbe lo stesso taglio.
- **Indirizzi con suggerimenti reali** (OpenStreetMap/Nominatim): "Dove Ha Studiato" e "Dove Ha
  Lavorato" non chiedono più un nome senza senso geografico — cerchi, scegli dal menu, il
  marker si crea da solo sulla mappa con le coordinate vere. Stesso trattamento per l'indirizzo
  in "Collega La Tua Casa" e in "Aggiungi Luogo" (lì la mappa resta solo per una rifinitura
  manuale del pin, non più per posizionarlo da zero).
- **Il refactor più importante**: Utente e Persona condividono ora lo stesso modello dati
  (`PersonalDetails`) e le stesse identiche sezioni del wizard (Identità, Istruzione E Lavoro,
  Corpo, Casa, Interessi). La scheda Scoperte di una persona non è più una lista di campi "+"
  generici: sono gli stessi campi ricchi e curati del wizard utente (Valori, Stile Di Vita,
  Stress, Stato Civile, tutto), esclusi solo Nome, Cognome e immagine — già chiesti alla
  creazione. Un marker creato da "Dove Ha Lavorato" nella scheda di una persona ora si attribuisce
  a quella persona, non più sempre all'utente.

Build verificata da zero dopo ogni pezzo, non solo alla fine.

## Checkpoint 8 — Animali e Albero Genealogico, dentro Rapporti

Come confermato: entrambi sono schede della pagina **Rapporti**, non moduli a sé.

- **Scheda Animali**: elenco degli animali con "Aggiungi Animale" (lo stesso wizard delle
  persone, ma limitato a Cane/Gatto). Ogni animale ha Carattere, Interessi e Abitudini
  proprie — tre liste curate da zero apposta per cani e gatti (~50 voci ciascuna), non le
  liste umane riciclate.
- **Meccanica Della Pappa**: orari configurabili, badge "Ho Fame" quando un orario è passato
  senza pasto registrato — piccolo come lo Zzz, mai una nuvoletta, per non rischiare lo stesso
  taglio già corretto. In Home resta solo indicativo; nella scheda Animali (dove c'è spazio
  sicuro) apre un menu del cibo ancorato al badge stesso, con 10 tipi di alimento. Dare da
  mangiare alza l'amicizia dell'1%, come richiesto.
- **Scheda Albero**: vero albero genealogico — card rettangolari e linee curve calcolate (non
  l'ennesimo bagliore, come promesso). Genitori si scelgono nella scheda "Casa" del wizard o
  delle Scoperte (nuovo campo, accanto a Partner e Amici); l'albero calcola da solo le
  generazioni, raggruppa i partner fianco a fianco e traccia i collegamenti.
- **Corretto un dettaglio rimasto indietro**: la lista "In Costruzione" in Home elencava ancora
  Finanze, Rapporti e Animali come se non esistessero — erano già tutti fatti. Ora sono vere
  scorciatoie cliccabili verso quei moduli.

## Checkpoint 9 — Impegni: l'ultimo pezzo del brief originale

- Scheda "Impegni" reale nella Finestra Persona (era "Presto", ora funziona), con lo stesso
  linguaggio grafico delle Task: titolo, note, data, ora inizio/fine, luogo collegato,
  "Avvisami Quando Inizia/Finisce" — inline, non l'ennesimo foglio dal basso.
- **"Si Trova A [Luogo]" ha davvero la precedenza sulle Azioni**, esattamente come richiesto:
  se un impegno è in corso, la riga sotto le informazioni della persona mostra quello; le
  Azioni tornano a comparire solo quando non c'è nessun impegno attivo.
- **Icona del luogo sull'avatar** quando una persona è impegnata da qualche parte — riuso lo
  stesso badge già costruito per la posizione automatica dell'utente, sia nelle card di
  Persone sia nei riquadri Casa/Fuori Casa di Home (con precedenza a "Ho Fame" per gli animali
  se capitano nello stesso istante — evita la sovrapposizione dei due badge).
- **Le notifiche funzionano davvero**, non solo come casella spuntata: il permesso del
  browser viene chiesto solo quando attivi per la prima volta un avviso (non all'apertura
  dell'app), e un controllo periodico invia la notifica al momento giusto — finché l'app
  resta aperta, lo stesso limite di piattaforma di cui abbiamo già parlato per la
  geolocalizzazione.

## Checkpoint 10 — le migliorie che avevo consigliato, tutte fatte (tranne quella esclusa)

**Sicurezza dei dati**, la priorità vera:
- Conferma prima di ogni eliminazione distruttiva — Persona, Luogo, Task, Attività Di Salute,
  Spese In Loop/Future/Singole, Obiettivi Di Risparmio.
- **Esporta/Importa** un backup completo (un file JSON, dati + immagini insieme), raggiungibile
  dal Resoconto Generale, con conferma esplicita e ricarica automatica dopo un'importazione.

**Il bug latente delle immagini**, risolto alla radice:
- Le immagini non vivono più come stringhe base64 dentro localStorage (dove saturavano la
  quota da 5-10MB dopo poche decine di foto): ora vivono in IndexedDB, con solo una chiave
  breve salvata nei dati strutturati. Un solo punto di scrittura (`ImageCropInput`), un solo
  hook di lettura (`useResolvedImage`) usato ovunque un'immagine compare in tutta l'app.
- Ho anche trovato e sistemato un doppione: `AvatarUploader` aveva una sua logica di ritaglio
  scritta a mano, mai passata dal componente condiviso — quindi bypassava la nuova
  archiviazione. Ora la usa anche lui.
- Pulizia automatica: eliminando una persona o un luogo, la sua foto principale si libera da
  IndexedDB invece di restare orfana per sempre.

**La promessa mancata, mantenuta**: il grafico della cronologia Rapporti — andamento
cumulativo nel tempo, colore che riflette il trend — non solo la lista testuale.

**Crescita infinita, ora contenuta**: tetto alla cronologia visite dei luoghi (500), ai
rapporti (300), alla pappa (500), alle streak delle attività quotidiane (400 giorni — ampio
abbastanza da non alterare mai una serie reale).

**Il wizard, ripensato**: il primo avvio ora chiede solo Nome, Cognome, Compleanno, Sesso e
avatar — cinque cose, non una quarantina. Tutto il resto (Valori, Stile Di Vita, Istruzione,
Corpo, Casa, Interessi) si trova in una nuova pagina, "Il Tuo Profilo", raggiungibile da Home,
con lo stesso spirito delle Scoperte di una persona: nessuna fretta, nessun passo obbligato.
Il vecchio wizard a tappe (`WizardShell.tsx`) e la sua sezione Identità sono stati rimossi:
codice morto, non più due strade diverse per la stessa cosa.

**Ricerca persone**, come richiesto al posto di ristrutturare gli ingressi multipli: cerca non
solo nel nome ma in tutto ciò che hai scoperto — soprannome, occupazione, dove ha
studiato/lavorato, tag di interessi, ogni campo libero. Ritrovi "quella persona che lavora in
quel posto" anche se non ricordi il nome.

**Rifiniture minori**: ricerca dentro il selettore delle 100 interazioni in Rapporti (prima
bisognava scorrerle tutte); il feed "Novità" in Home ora ha un pulsante "Pulisci".

Build verificata dopo ogni pezzo, non solo alla fine.

## Checkpoint 11 — bug nei colori e ultimo pezzo del brief

**Bug reale nel Colore Task, trovato e corretto**: la formula che genera la palette
convertiva HSL in esadecimale trattando la luminosità come 0-100 in un punto del calcolo e
come 0-1 in un altro — il risultato erano stringhe come `#-263127632763`, non colori validi.
Il browser le ignorava in silenzio: gli swatch sembravano vuoti, non mancanti. Ho verificato
il bug riproducendolo prima di toccare il codice, poi corretto normalizzando saturazione e
luminosità a 0-1 prima del calcolo, come richiede la formula HSL→RGB standard. Adesso
produce davvero 50 toni "gioiello" distinti — l'ho verificato anche questo, non solo
dichiarato.

**L'ultimo pezzo rimasto dal brief originale**: la presenza in Home dettata dalle Task.
Prima, Casa e Fuori Casa riflettevano solo "Vive Con Te" in modo statico — chiunque non
vivesse con te restava per sempre nel riquadro Fuori Casa, chiunque vivesse con te restava
sempre in Casa, a prescindere da qualunque task. Ora, se una tua task coinvolge altre persone
ed è attiva in questo momento, il luogo collegato decide dove appaiono: a "Casa Di [Te]" li
vedi in Casa, altrove li vedi in Fuori Casa, finché la task non finisce — esattamente come
descritto, e con effetto collaterale corretto: chi non vive con te e non ha nessuna task
attiva ora non compare più in nessuno dei due riquadri, invece di affollare Fuori Casa per
sempre solo perché esiste come persona.

Con questo, tutto ciò che il README segnava come rimanente e realizzabile (non un limite di
piattaforma) è stato costruito.

## Checkpoint 12 — bug di sovrapposizione e di maiuscolo

**Il bug vero**: nella Finestra Persona, il contenuto della scheda "Scoperte" (di gran lunga il
più lungo — cinque sezioni intere) poteva comprimere le righe sopra di sé — pulsante Chiudi,
avatar, e le schede Scoperte/Impostazioni/Impegni — perché in un contenitore flessibile con
altezza massima vincolata, senza dichiarare esplicitamente che quelle righe non devono mai
restringersi, il browser è libero di farlo quando il contenuto sotto è molto più lungo del
solito. Corretto bloccando ogni intestazione (`shrink-0`) e dandole priorità di sovrapposizione
esplicita (`relative z-10`), così anche in un caso limite resta sempre sopra, mai coperta.

Non era isolato: ho controllato l'intero codice, non solo il punto segnalato. Lo stesso schema
(intestazioni fisse + contenuto scrollabile, altezza massima vincolata) esisteva identico in
altri sette pannelli — Task, Luogo, Aggiungi Luogo, Nuova Task, Registra Attività, Resoconto
Generale, e il pannello luoghi della Mappa. Il bug lì era solo meno visibile perché il loro
contenuto è più corto, non perché il rischio non ci fosse. Corretti tutti allo stesso modo,
non solo quello segnalato.

Un limite onesto da segnalare: la build che uso per verificare (`npm run build`) controlla che
il codice compili e i tipi siano corretti — non rende visivamente la pagina, quindi non
intercetta bug di questo tipo. "Build verificata" da qui in avanti significa "compila senza
errori", non "ho controllato che nulla si sovrapponga a schermo" — sono due cose diverse, e
è giusto che tu sappia esattamente cosa garantisce e cosa no.

**Maiuscolo**: "Forse Sta"/"Probabilmente Sta" → "Forse sta"/"Probabilmente sta", coerente con
la regola già stabilita (maiuscola di sola frase). Ho controllato se lo stesso errore si
ripeteva altrove e ho trovato altri due punti dimenticati nello stesso meccanismo: "Si Trova A
[Luogo]" (stessa riga di testo di "Forse sta", nella card) e l'interazione generata dal dare
da mangiare a un animale ("Le Hai Dato Da Mangiare" → "Le hai dato da mangiare", per restare
coerente con le altre 100 interazioni curate, tutte già in maiuscolo di sola frase).

## Checkpoint 13 — la lista lunga: bug reali, Mondo, animali, Albero rifatto, Impegni identici alle Task

**Bug corretti:**
- Peso che partiva da 1Kg nel grafico: registrava una pesata a ogni tasto premuto, quindi il
  primo carattere digitato diventava la prima voce salvata. Ora registra solo quando finisci
  di scrivere.
- "Novità" con ID grezzi al posto dei nomi (Partner, Amici): ora risolti nel nome vero.
- Nuvolette di dialogo che sembravano apparire solo sulla prima card: le card erano troppo
  vicine (10px), la nuvoletta invadeva quella sopra — spaziatura corretta.
- Avatar nelle card Task: ingranditi, più sovrapposti, il cerchio scuro ora aderisce davvero
  al bordo (prima si applicava a un contenitore 4px più largo del cerchio visibile).

**"Persone" è diventata "Mondo"** (rotta, navigazione, testi correlati) — perché contiene sia
persone che animali, e "Persone" non aveva più senso.

**Le regole di Casa/Fuori Casa, riscritte davvero:**
- Chi vive con te resta in Casa, a meno che non abbia un proprio Impegno (indipendente
  dall'utente) in un luogo diverso da Casa in questo momento — allora va in Fuori Casa.
- Chi NON vive con te non entra mai in Fuori Casa solo perché esiste: ci va solo se ha in
  corso una task con te (o con chi vive con te) in un luogo diverso da Casa, finché la task
  non finisce.
- Chiunque altro — che tu conosca ma con cui non hai in corso nulla di tutto questo — resta
  solo nella scheda Mondo, con un alone d'aura diverso (azzurro, non rosso: il rosso resta
  riservato a chi è davvero Fuori Casa).
- Per l'utente le meccaniche restano invariate (geolocalizzazione, task altrove).

**L'Albero Genealogico, ricostruito da zero.** Non più un albero unico: ora un menu di avatar
raggruppati per famiglia ("Famiglia Cognome1, Cognome2"), cliccabili per entrare nell'albero
di ciascuno. Dentro, parentele vere — Padre, Madre, Fratelli, Sorelle, Figli, Figlie, Cugini,
Cugine, Zii, Zie, a scelta multipla dove previsto — e un motore che deriva da solo Suoceri,
Generi, Nuore e Cognati leggendo i legami dichiarati (anche al contrario, se dichiarati solo
dall'altra persona). Rimosso "Genitori" dal wizard e dalle Scoperte: la parentela si sceglie
solo qui, ora.

**Animali:**
- Sesso Maschio/Femmina (non più Uomo/Donna/Non Binario/Preferisco Non Specificare).
- Rimossi dalle Scoperte: Valori, Ambizioni, Obiettivi, Stile Di Vita (restano gli altri campi).
- "Numero Di Telefono" → "Telefono Di Un Padrone".
- "Vive Con Te" sostituito da "Chi È Il Padrone?" (scelta tra le persone esistenti o te
  stesso) — se il padrone vive con te, l'animale appare in Casa, altrimenti no. Modificabile
  anche dopo la creazione, dentro Cura Dell'Animale.
- La card in Mondo mostra "Gatto/Cane Di [Nome Cognome Del Padrone]".
- Rimossa la scheda "Animali" da Rapporti, senza toccare Rapporti o Albero.

**Impegni delle persone, davvero identici alle Task.** Ho estratto tutti i campi di
creazione — titolo, note, tipo, data/ora, ricorrenza, colore, priorità, tag, persone
coinvolte, luogo, sub-task, lista della spesa — in un unico modulo condiviso, usato sia dalle
Task che dagli Impegni: non più un sottoinsieme che finge di essere completo. Aggiunta anche
la vista Calendario sotto "Aggiungi Impegno", con la stessa striscia di date già usata per le
Task, che espande correttamente le ricorrenze.

## Checkpoint 14 — la lista più lunga finora: bug, Task ripensate, Albero completo, spesa reale

**Le due risposte che avevi chiesto prima di toccare nulla**: soglia Fuori Casa **500 metri**,
invariata. La scritta ripetuta sulla mappa veniva dalle tile gratuite di CartoDB, che ora
richiedono una chiave oltre una certa soglia d'uso — non un bug nostro.

**Bug reali, corretti:**
- L'indirizzo bloccava la scrittura dopo aver selezionato un suggerimento: un numero civico
  aggiunto dopo non veniva mai salvato. Ora il testo libero è sempre la fonte di verità, i
  suggerimenti servono solo a fornire le coordinate.
- L'utente non appariva mai Fuori Casa per una propria task altrove — mancava del tutto quel
  collegamento, aggiunto ora con la stessa logica già valida per le altre persone.
- Le task non erano modificabili — corretto: stesso modulo di creazione, riusato per la modifica.
- Mappa: passata dalle tile scure di CartoDB (causa anche della scritta) a OpenStreetMap
  standard — chiare, gratuite, senza chiave.

**Le Task, chiarite come richiesto:**
- Evento e Appuntamento: orario di inizio e fine, avviso anticipato configurabile (da 5 minuti
  a 1 settimana prima, o nessuno). Non si spuntano più a mano: si completano da sole quando
  l'orario di fine coincide con l'ora reale (controllo periodico).
- Promemoria, Obiettivo e Spesa: orario di inizio, scadenza data+ora, stesso avviso
  anticipato. Restano spuntabili a mano; se la scadenza passa senza spunta, vanno nella
  categoria "Non Completate" — nuovo filtro a tre voci (Attive/Non Completate/Completate)
  nella pagina Task, così la lista attiva resta pulita.
- Attività Quotidiana: invariata.
- Impegni delle persone: ora identici a una Task di tipo Evento, stesso modulo di campi
  condiviso, stesso meccanismo di avviso.
- La ricorrenza "Personalizzata" ora apre davvero la scelta dei giorni della settimana.
- **Log Con Countdown in Home**: quando l'avviso anticipato di una task scatta, compare in
  Home con un countdown live fino all'inizio (o alla scadenza) — la stessa durata scelta come
  avviso, che scorre a ritroso — più la notifica del browser allo stesso momento.

**L'Albero Genealogico, completato:**
- Aggiunte Marito, Moglie, Ex Marito, Ex Moglie (etichetta derivata dal sesso) e Partner,
  integrati anche nella derivazione di suoceri e cognati.
- **Collegamento bidirezionale automatico**: impostare un fratello, un figlio, un coniuge da
  un lato scrive anche dall'altro lato, con precisione basata sul sesso — esattamente come
  descritto, incluso il caso in cui il collegamento era stato fatto solo da un lato.
- Amici e Migliori Amici: per una persona restano a scelta manuale (nel wizard delle
  Scoperte); per l'utente sono derivati dai Rapporti (soglia "Amicizia" e "Vera Amicizia").
  Mostrati nell'Albero in una sezione separata, con intestazione propria, per non fare
  confusione con i parenti veri.
- "Stato Civile" e "Partner" eliminati del tutto dal wizard di scoperta — non solo nascosti,
  rimossi dal codice — perché ora si gestisce tutto qui.

**Animali:**
- Filtro "Solo Animali" in Rapporti.
- Avatar squircle (angoli arrotondati invece del cerchio perfetto) per differenziarli dalle
  persone — scelta ragionata tra alcune alternative (esagono, bordo a zampa, doppio anello) e
  scelta perché coerente col resto dell'app, che usa angoli arrotondati ovunque tranne che
  negli avatar. Stessi tre colori Casa/Fuori Casa/Mondo, applicata ovunque un animale mostra
  il proprio avatar. Trovato e corretto anche un bug di passaggio: la riscrittura del
  componente aveva perso il colore del bagliore per tutti, non solo per gli animali —
  individuato e risolto prima di consegnare.

**Spesa reale, non più solo "Cibo":**
- Supermercato e Negozio: il popup "Quanto Hai Speso" ora permette di dividerla tra più
  categorie (Cibo, Casa, Abbigliamento, Elettronica...) con "Altro" a nome libero.
- Bar e Ristorante restano semplici, un unico importo salvato come Cibo, come richiesto.
- Servizio ha 14 voci dedicate (Meccanico, Elettrauto, Gommista, Banca, Assicurazione,
  Parrucchiere...), diverse da tutte le altre.
- Il calcolo mensile di Finanze ora legge questa ripartizione quando c'è, mappando ogni voce
  libera sulla categoria di budget più vicina, invece di appiattire tutto sul tipo di luogo.

**Grafico Di Frequentazione per persona**: non esisteva, ora sì — quante volte l'hai
frequentata negli ultimi 6 mesi (task completate insieme + visite ai luoghi insieme),
mese per mese, nella pagina di dettaglio Rapporti.

Build verificata dopo ogni blocco, non solo alla fine — è stata una sessione lunga, e più di
una volta ho trovato e corretto un errore che avevo appena introdotto io, prima di consegnare.

## Checkpoint 15 — mega audit: card personale, stati d'animo, Albero, bug veri

Sessione di audit su richiesta esplicita, con una lista lunga di correzioni mirate.

**Card personale, riunificata:**
- Nuovo pulsante in alto a sinistra, leggermente sovrapposto all'avatar: apre un menù con
  "Stati D'Animo", "Bisogni", "Malattia", ognuno nella propria finestra. Prima erano sparsi
  (una pagina intera `/stati`, una sezione dentro Profilo, un bottone testuale in Home) —
  rimossi da lì, vivono solo qui adesso.
- Tolta la scritta "Non Ti Senti Bene?"; lo stato d'animo attivo resta visibile com'era.
- I gradienti di sfondo legati allo stato d'animo ora hanno un "tono" diverso a seconda del
  tipo di stato (vivido/delicato/cupo/pesante) — un colore acceso come il giallo non stona
  più a piena forza su un fondo quasi nero.
- Effetto malattia tolto dal perimetro della card; migliorato (bordo ambra invece di grigio)
  quello attorno all'avatar, l'unico punto in cui resta.

**Bug reali, corretti:**
- Sfondo che "si rompeva" scendendo con lo scroll: il gradiente era legato all'altezza del
  `body` (bloccata a un solo schermo); oltre quel limite si vedeva solo il colore pieno
  sottostante. Ora è un livello fisso agganciato al viewport, copre sempre tutto.
- Nome e cognome che tornavano al valore precedente dopo averli corretti: un campo era
  legato al valore con cui la finestra era stata aperta invece che allo stato in tempo
  reale — un classico controlled-input bloccato.
- Finestra di creazione di una persona che finiva oltre il notch, rendendo difficili alcune
  interazioni: non aveva un'altezza massima con scorrimento interno, ora sì.
- Il pulsante del menù sulla card personale non rispondeva: era un `<button>` dentro un
  altro `<button>` (HTML non valido — il click veniva "rubato" da quello esterno, che apriva
  la scheda utente invece del menù).

**Defunto:**
- Attivabile ora anche dalle Impostazioni di ogni persona, non solo al momento della
  creazione. Chiede giorno, mese e anno separatamente — ognuno facoltativo e indipendente
  dagli altri (puoi sapere solo l'anno, o solo mese e giorno, o nessuno dei tre): quello che
  manca appare come "????", mai nascosto.
- Quarta riga nell'Albero sotto l'avatar del defunto, formato "[anno nascita] - [anno
  morte]"; stesse date anche nella sua scheda.
- L'alone attorno all'avatar dei defunti è stato tolto — resta solo la foto desaturata.

**Fratellastro/Sorellastra**: eliminato dal vocabolario dell'app su richiesta esplicita —
resta solo "Fratello"/"Sorella", anche per chi entra in famiglia per il nuovo matrimonio di
un genitore. Tutti i collegamenti dell'Albero corretti di conseguenza.

**Avatar vuoto**: il pulsante "Esiste, Ma Non So Chi È" ora crea davvero un avatar senza
nome (non più un nome segnaposto come "Padre Sconosciuto") — contorno tratteggiato, "?" al
posto delle iniziali, diverso apposta dall'avatar di un defunto. Pienamente funzionale in
ogni altra parte dell'app (Scoperte, Impostazioni, Impegni) come qualsiasi altra persona;
torna un avatar normale da solo al primo nome o cognome scritto. Su richiesta successiva,
questi due campi — finché resta vuoto — si scrivono nel wizard Scoperte, sezione Identità
(scoprire chi è è una Scoperta a tutti gli effetti), e tornano in Impostazioni non appena
smette di esserlo.

**Filtro Per Parentela**: prima un'unica voce di menù per ogni famiglia allargata, con
potenzialmente troppi cognomi ammassati insieme. Ora una voce per ogni coppia sposata
("Famiglia Fioretti, Gentile" mostra solo chi porta uno dei due cognomi) — voci diverse
anche quando sotto è lo stesso identico grafo esteso: aprendo il dettaglio di una qualsiasi
delle famiglie coinvolte si vedono comunque tutti i ponti verso le altre. Chi non ha un
proprio coniuge registrato ma resta comunque connesso a una famiglia finisce in un gruppo di
riserva a cognome singolo, mai perso; solo chi non ha alcun legame familiare resta "Senza
Famiglia Collegata", come prima.

**Parenti Vs Amici**: chi è già un parente (a qualunque grado, anche alla lontana) non
compare più come "Amico"/"Migliore Amico" nell'Albero — prima poteva capitare che un genitore
con cui hai un ottimo rapporto finisse duplicato anche sotto "Amicizie — Non Parentela". Il
legame forte resta comunque visibile: un anello più intenso e un piccolo cuore sulla riga che
quella persona ha già nell'Albero, mai una seconda card.

**Costellazione**: tolti nomi ed etichetta di rapporto sotto ogni avatar; esclusi i
familiari (stessa regola di sopra) e chi ha rapporto "Indifferenza".

## Checkpoint 16 — Vitaecom

La funzione più grande costruita finora: un vero social network, non solo una scheda in
più. Attenzione: le prime due direzioni esplorate insieme (un "erbario" con illustrazioni
botaniche generate, poi un diario privato con foto Polaroid) sono state entrambe scartate
durante la discussione, su indicazione esplicita — quello che segue è solo la versione
finale, quella davvero costruita.

**Nickname**: nuovo campo nel wizard di creazione (facoltativo lì), con verifica di
disponibilità in tempo reale. Se lasciato vuoto, un cancello dedicato blocca l'accesso a
ogni pagina di Vitaecom finché non se ne sceglie uno valido e libero.

**Due barre di navigazione**: quella consueta ("offline") e una nuova ("online") che la
sostituisce solo dentro le pagine di Vitaecom, stessa posizione e dimensione — Home,
Profilo, Vitaeworld, Chat. La scheda "Home" non è una scheda di Vitaecom: è l'uscita, e
riporta alla barra consueta da sola.

**Il post**, esattamente come descritto: bordo del colore dello stato d'animo scelto;
avatar, nickname e stato d'animo in alto; corpo del post in un riquadro proprio; sotto,
a sinistra la Gemma (si riempie del colore dello stato d'animo al tocco, si svuota al
secondo), la Nuvoletta dei commenti, la freccia di Condivisione; a destra gli avatar
taggati sovrapposti, senza nome, che si espandono in un elenco al tocco.

**Commenti**: un livello di risposta con leggera rientranza (mai più in profondità, per
reggere centinaia di commenti senza restringersi all'infinito); il primo commento
dell'autore del post e il primo di ogni account taggato risultano "Posizionato In Alto",
il resto resta cronologico. Ogni commento ha la propria Gemma e può essere inoltrato: il
testo si copia nel formato "Commento Del Post Di [nickname] Del [data] Alle [ora]:" seguito
dal testo, con un bottone che apre la condivisione reale del telefono (WhatsApp e tutto il
resto) oltre a un elenco di account recenti.

**Imprimi Momento**: raccoglie lo stato d'animo attivo e le task completate nell'ultima
ora, l'utente sceglie cosa includere davvero; didascalia scritta a mano oppure da
un'intelligenza artificiale vera (non finta — gira su una route server dedicata, tono
intonato allo stato d'animo scelto), sempre e solo una foto propria, mai generata; si
possono taggare account nel post.

**Notifiche**: pallino del colore dello stato d'animo sulla barra di navigazione (sia
offline che online) quando arriva un'interazione su un tuo post; una scheda "Messaggi"
dentro Chat le elenca tutte.

**Bozza conservata**: se esci da Vitaecom con "Home" mentre stai scrivendo un post o un
commento, quella bozza resta pronta e si riapre da sola al ritorno — chiuderla apposta con
la X, invece, la scarta.

**Onestamente simulato, e dichiarato come tale nel codice stesso**: l'app non ha (per
scelta, vedi sopra) un database né un server con altri utenti veri. Finché non ci sarà:
- il controllo di unicità del nickname e i "commenti"/"like" che arrivano sui tuoi post sono
  generati da tre account dimostrativi locali, sempre segnalati come tali nell'interfaccia;
- la scheda Chat mostra come si presenterà, ma non manda messaggi veri;
- inoltrare un commento a un account Vitaecom copia solo il testo — non esiste ancora un
  posto dove recapitarlo davvero (condividerlo fuori dall'app, quello sì, è reale).

L'assistente di scrittura in Imprimi Momento è invece già una vera integrazione: le
richieste `POST /api/vitaecom-caption` chiamano l'API di Anthropic sul server, non nel
browser — va solo aggiunta una variabile d'ambiente `ANTHROPIC_API_KEY` nelle impostazioni
del progetto su Vercel perché risponda davvero, invece di segnalare che manca.



Il brief originale è coperto per intero. Quello che segue non è "mancante" nel senso di
promesse non mantenute, ma affinamenti che meritano un giro loro quando serviranno:

- **Notifiche push vere** (anche ad app chiusa): richiedono un servizio lato server con
  chiavi VAPID. Le notifiche degli Impegni funzionano già, ma solo ad app aperta.
- **Vibrazione**: solo su Android — Safari/iOS non supporta l'API, è un limite della
  piattaforma.
- **Geolocalizzazione**: precisa solo ad app aperta, sia per Casa/Fuori Casa sia per il
  rilevamento di prossimità ai luoghi — limite delle web app, non di questa implementazione.
- Le tre liste da ~50 voci (Valori, Stile Di Vita, Categorie D'Interesse, Carattere/Interessi/
  Abitudini Animali) sono curate a mano, non le 100 originariamente richieste per ciascuna —
  scelta di qualità sulla quantità, dichiarata fin dall'inizio.
- **Vitaecom è vincolato dall'assenza di un vero backend** (vedi Checkpoint 16): finché
  resta un'app solo-locale, l'unicità del nickname, le interazioni sui post e la Chat non
  possono diventare reali — sono simulate con account dimostrativi, sempre segnalati come
  tali. L'assistente di scrittura è invece già collegato per davvero all'API di Anthropic.
- **Allegato video** in Imprimi Momento: non implementato, solo la foto per ora.
- **Card della Chat**: mostrano solo avatar e nickname; la struttura più ricca descritta
  (anteprima dell'ultimo messaggio, frasi azioni, nuvoletta di dialogo) non è stata costruita
  perché, senza una chat reale dietro, non c'era ancora nulla di vero da mostrarci.

## Checkpoint 17 — le due segnalazioni, e un audit vero dietro a quelle

Due bug segnalati, entrambi confermati e corretti — ma stavolta, invece di limitarmi ai due
punti esatti, ho riletto il codice intorno a ciascuno per capire se lo stesso errore si
ripeteva altrove, come nei checkpoint passati. Ecco cosa ho trovato.

**La barra "online" non era davvero identica a quella "offline".** Il commento nel codice
lo dichiarava ("stessa posizione e dimensione"), ma il markup era stato scritto da zero
invece di riusare quello vero: una barra piena larghezza ancorata al fondo con un bordo
superiore, non la pillola fluttuante e vetrosa di `BottomNav`; icone da 20px invece di 18,
etichette da 10px invece di 9; la scheda attiva segnata solo da un cambio di colore del
testo, non dalla pillola violetta con bagliore. Un commento che descrive l'intenzione giusta
non è la stessa cosa del codice che la rispetta — ho ricopiato contenitore, padding,
dimensioni e stato attivo esattamente da `BottomNav.tsx`: ora cambia solo la sequenza delle
schede (Home/Profilo/Vitaeworld/Chat), come da richiesta originale, non anche la forma.

**Il menù della card personale, tagliato per davvero.** La card è una `GlassCard` con
`overflow-hidden` — le serve, non è un errore in sé: senza, il bagliore dello stato d'animo
e la sfumatura "sheen" sporgerebbero oltre gli angoli arrotondati (lo stesso motivo per cui
in Checkpoint 7 avevo spostato le nuvolette invece di togliere quell'overflow). Il menù a
tendina però non ha nessun bisogno di vivere dentro quella scatola: ora esce dal DOM della
card con un portal su `document.body` e si posiziona da solo in coordinate reali (misurate
al momento dell'apertura, ricalcolate se ridimensioni la finestra, il menù si richiude da
solo se scrolli — la stessa cosa farebbe qualunque popover quando il suo ancoraggio si
sposta sotto di lui).

**Cercando lo stesso schema altrove, ho trovato un secondo caso — non ancora un bug visibile,
ma una funzione promessa e mai raggiungibile.** `HungryBadge` (il badge "Ho Fame" degli
animali) ha davvero un menu del cibo interattivo già scritto, con tanto di commento che ne
spiega la cautela ("interattivo solo dove c'è spazio sicuro, nella scheda Animali"). Ma
`HungryBadge` risultava importato in un solo punto di tutto il codice — `HouseholdAvatarCell`
di Home — sempre senza la prop `interactive`. La "scheda Animali dove c'è spazio sicuro" di
cui parla il commento non esisteva più: era diventata la scheda **Mondo** nel Checkpoint 13,
e nessuno aveva mai ricollegato lì il badge interattivo. Risultato: la meccanica "dare da
mangiare alza l'amicizia dell'1%", dichiarata completa fin dal Checkpoint 8, non era
raggiungibile da nessuna schermata dell'app. L'ho collegata davvero in `PersonCard` (la card
di ogni animale in Mondo), con la stessa precedenza già stabilita in Home tra "Ho Fame" e
l'icona del luogo, per evitare che i due badge finiscano sovrapposti nello stesso angolo.
Collegarlo lì significava mettere un `<button>` (quello del badge) dentro un altro `<button>`
(la card stessa) — esattamente il bug HTML non valido già corretto nella card personale nel
Checkpoint 15 — quindi ho convertito anche la card di `PersonCard` in un `<div role="button">`
accessibile, com'era già stato fatto lì.

**Corretta anche una frase del README stesso, non solo codice.** In fondo al Checkpoint 16 era
rimasta una riga che segnava come mancante la "presenza in Home dettata dalle Task
dell'utente" — ma quella funzione era già stata costruita e verificata nel Checkpoint 11
(`userTaskDrivenLocation`, tuttora usata in `app/home/page.tsx`). Era una frase rimasta
indietro rispetto al codice, non un gap reale: rimossa, per non far ripartire da capo un
lavoro già fatto.

Build verificata da zero (`npm install` + `npm run build`) dopo tutte le modifiche, non solo
dichiarata: compila ed è tipizzata correttamente.

## Checkpoint 18 — Vitaecom (rinominato), il popup dello stato d'animo, e il vero sistema di profilo

**Rinominato Vitaegram in Vitaecom, per intero.** Non solo il testo a schermo: cartelle,
file, tipi (`VitaecomPost`, `VitaecomAccount`...), rotte (`/vitaecom`, `/vitaecom/chat`,
`/vitaecom/profilo`, `/api/vitaecom-caption`), chiavi di storage. Trovati e tolti due residui
morti nello stesso giro: `lib/vitaegram-develop.ts` (mai importato da nessuna parte, avanzo
della direzione "diario Polaroid" scartata al Checkpoint 16) e la cartella vuota
`app/api/vitaegram-reflect` (nessun `route.ts` dentro — non era nemmeno una vera rotta).

**Popup "Ti Senti Così?"**: "Non Ora" e "Impostazioni" ora sono due metà simmetriche dello
stesso pulsante, separate da un filo verticale — "Impostazioni" apre il wizard degli stati
d'animo vero (`MoodWizardPanel`), non una scorciatoia diversa. Sotto, un interruttore
"Condividi Stato D'Animo Su Vitaecom" (acceso di serie): quando è spento, il profilo Vitaecom
mostra sempre "Normale" a prescindere da come stai davvero — l'ho messo anche dentro il
wizard stesso, non solo nel popup transitorio, perché altrimenti l'unico modo di riaccenderlo
sarebbe aspettare un altro innesco a caso.

**La durata dello stato d'animo, da 1 a 12 ore.** Passata quella soglia ricade su "Normale" —
già succedeva così ovunque nell'app grazie al ripiego `mood ?? normale` già in uso in Home
(non ho dovuto inventare un meccanismo nuovo, solo estenderlo anche a Vitaecom).

**Sfondo Vitaecom più chiaro di quello offline**: un nuovo layout (`app/vitaecom/layout.tsx`)
aggiunge un velo ambra sopra la base scura comune a tutta l'app — stessa tecnica già
corretta al Checkpoint 15 per non "rompersi" scorrendo (un livello fisso agganciato al
viewport, non legato all'altezza del contenuto).

**Il sistema di profilo, il pezzo grosso.** In cima, un riquadro — la Vetrina — che rompe
davvero la larghezza della pagina (un vero *breakout* a schermo intero, tecnica CSS mai usata
prima in questo progetto: margini negativi calcolati sul viewport, non un contenitore più
largo). Non è un campo di testo libero da un'altra scheda da tenere sincronizzata a mano:
pesca — con una selezione a scelta dell'utente, fino a 8 voci — da quello che hai già scritto
in "Il Tuo Profilo" (film, musica, libri, giochi, valori, luoghi, cibi, categorie, carattere,
stile di vita), con le miniature vere dove esistono. Sotto, l'avatar centrato e cliccabile,
con l'alone del colore del tuo stato d'animo attuale (rispettando l'interruttore appena
descritto); sotto ancora il nickname preceduto da "@", poi genere e stato d'animo in piccolo,
separati da un punto, il nome dello stato colorato del suo colore.

**Toccare l'avatar fa due cose diverse, a seconda di chi guarda**:
- **Il proprietario** finisce dritto nel proprio wizard delle scoperte — la pagina "Il Tuo
  Profilo" già esistente offline, non una copia.
- **Un ospite** (chiunque visiti un profilo che non è il proprio) apre "Ultime Scoperte Su
  [nickname]": le ultime informazioni scoperte, con "Esplora Altro" in fondo che apre una
  finestra a tre schede — Scoperte, Rapporto, Albero — ciascuna con un "+" in alto a
  sinistra per continuare ad aggiungere, come richiesto (un solo pulsante, cambia solo cosa
  apre a seconda della scheda attiva).

**La scelta architetturale sotto tutto questo**: l'app non ha un vero backend (vedi
Checkpoint 16) — "Scoperte", "Rapporto" e "Albero" su un account altrui hanno bisogno di dati
veri da qualche parte, e l'unico posto dove esistono davvero è il tuo Mondo. Un account
Vitaecom (oggi solo quelli dimostrativi) si può quindi **collegare a una Persona vera** che
conosci — una scelta esplicita tua, mai indovinata per nome. Una volta collegato, le tre
schede diventano vere per davvero, riusando i componenti offline esistenti invece di
duplicarli con dati finti: `PersonWindow` (la scheda Scoperte vera, "+" ci apre proprio
quella), `RelationshipGauge` + `RelationshipChart` (la scheda Rapporto, con le stesse ultime
interazioni e lo stesso grafico "Andamento Nel Tempo" di offline), `FamilyRelationEditor` con
la stessa logica di scrittura reciproca (`enrichParentPatch`/`computeReciprocalWrites`) già
usata nell'Albero vero. La scheda Albero qui mostra i legami diretti in un elenco compatto
(non il layout SVG intero, troppo per stare in un foglio) più un pulsante che apre l'Albero
Genealogico completo, quello vero, quando serve la vista intera. In più, cercando il nickname
di un altro account dentro l'editor dell'Albero, se ne può creare al volo una Persona
collegata e usarla subito come ruolo — come richiesto esplicitamente.

**Perché "l'ospite non condivide ciò che scopre col proprietario" non ha richiesto nessun
meccanismo apposta**: è già vero per costruzione. Scoperte/Rapporto/Albero restano dati sul
tuo dispositivo, mai su quello di nessun altro — lo stesso principio già dichiarato per tutto
il resto dell'app, qui semplicemente si applica anche a questo.

**Semplificazioni dichiarate**, per restare onesti su cosa è stato davvero costruito:
- La Vetrina esiste oggi solo per il proprietario: un account dimostrativo non ha un vero
  profilo `PersonalDetails` dietro da cui pescare, quindi non gli si finge una vetrina vuota.
- Una Persona creata al volo dal nickname di un account parte con sesso "Uomo" come valore
  neutro di comodo — si corregge in un tocco dalle Scoperte vere, non l'ho lasciato a un
  ripiego più fragile (indovinare dal nome, per esempio).
- Trovato durante la scrittura e corretto prima di consegnare, non dopo: il raggruppamento
  dei campi delle Scoperte per sezione (Identità/Istruzione E Lavoro/Corpo) inizialmente
  confrontava le etichette tradotte in italiano invece delle chiavi originali del dato — un
  campo con l'etichetta scritta diversa da come compariva nel secondo elenco sarebbe
  sparito in silenzio (è successo davvero a "Compleanno" e "Sesso" mentre scrivevo, prima di
  accorgermene). Ora il raggruppamento è per chiave, non per stringa — un solo elenco da
  tenere aggiornato, non due.
- Peso e Altezza (numeri, non testo) inizialmente non comparivano mai tra le Scoperte
  dell'ospite per lo stesso tipo di errore (un controllo che accettava solo stringhe) —
  corretto insieme al punto sopra.

**Chiesto subito dopo — "hai creato dei campioni per simulare le funzioni?"**: no, non
all'inizio, di proposito: iniettare una Persona finta nel tuo Mondo reale senza chiedertelo
avrebbe sporcato dati che in tutta l'app sono sempre stati onestamente tuoi. Ora "Non Hai
Ancora Collegato" ha una seconda scelta, esplicita, sotto un separatore "Oppure": "Crea Una
Persona Di Esempio Per Provare Subito" — solo per i tre account dimostrativi, con una manciata
di Scoperte e due interazioni vere scritte a mano (coerenti col personaggio già suggerito dai
suoi post — Nina e il caffè lungo, Leo e la corsa, Sara e le foto vecchie), non generate a
caso. Crea una Persona vera in Mondo, marcata `isDemo` — un badge "Esempio" la segna nella
lista (vedi PersonCard) per non confonderla con un contatto vero mesi dopo, ma resta a tutti
gli effetti una Persona normale: si modifica, si cancella, conta nell'Albero. Mai creata da
sola all'avvio, solo con questo tocco esplicito.

Build verificata da zero (`npm install` + `npm run build`) dopo ogni blocco, non solo alla
fine — compila ed è tipizzata correttamente. Non ho potuto verificarla a schermo (nessun
browser in questa sessione): "build verificata" resta, come sempre dichiarato da qui in
avanti, "compila senza errori", non "ho controllato che nulla si sovrapponga o si tagli a
schermo".

## Checkpoint 19 — sfondo, malattia rimossa, tre bug veri trovati con un audit, Studia/Lavora

Una lista lunghissima di correzioni e richieste in un solo messaggio — questo checkpoint copre
la prima metà, la più tecnica; il resto (post, gemma, il sistema Persone/Sconosciuto) segue nei
prossimi.

**Sfondo, per davvero stavolta.** Il gradiente restava invisibile perché `body` aveva ancora
un colore pieno accanto a quello di `html` — e per l'ordine di pittura CSS, lo sfondo di un
box normale (non `fixed`) si dipinge SOPRA i discendenti con z-index negativo, non dietro:
una parete scura praticamente identica al gradiente sotto, che lo copriva ovunque oltre il
primo schermo. Il colore pieno ora vive solo su `html`; `body` resta trasparente. Sfondo anche
più chiaro (`#0D101B`) e gradiente più acceso, stessi tre colori Aura.

**Malattia, rimossa per intero.** Sei file cancellati (`IllnessSheet`, `IllnessVignette`,
`IllnessFilterDefs`, `FrayedRing`, `IllnessCheckInCard`, `illness-context.tsx`), ogni
riferimento in `AuraAvatar`, Home, `layout.tsx`, `PersonalCardMenu`, la classe CSS
`.illness-grain`. Il wizard degli Stati D'Animo/Bisogni ora ha due voci, non tre.

**Tre bug veri trovati con un audit, non solo dichiarati:**
- Le finestre Stati D'Animo/Bisogni restavano intrappolate dentro la card personale di Home,
  impossibili da scorrere davvero: la card è dentro un `<Reveal>` (framer-motion,
  `animate={{y:0}}`), che lascia un `transform` inline anche a riposo — e un discendente con
  `position:fixed` dentro un antenato con `transform` non è più relativo al viewport, ma a
  quell'antenato. Corretto alla radice in `PersonalCardSheet` (condivisa da sei punti
  dell'app) con un portal su `document.body`, non solo nel punto segnalato.
- La pallina del toggle "Condividi Stato D'Animo Su Vitaecom" era disallineata — e lo stesso
  identico difetto (un `translate-x` calcolato sulla posizione naturale nel flusso invece che
  `position:absolute` ancorata) c'era già in altri **quattro** punti dell'app (Vive Con Te e
  Defunto/A in `AddPersonModal`). Estratto un componente `Switch`/`SwitchVisual` condiviso,
  sostituite tutte e cinque le occorrenze.
- Aprendo l'Albero di un account demo dentro "Esplora Altro", l'utente vero compariva come
  "Parente Alla Lontana" senza alcun legame dichiarato: `relationshipInfo` presuppone che chi
  la chiama abbia già scartato le persone non collegate (il suo ultimo ramo di ripiego
  etichetta chiunque non rientri nelle regole sopra come "Parente Alla Lontana", **sempre** —
  lo dice il suo stesso commento, ma non lo verifica lei). La pagina Albero offline si
  protegge filtrando prima con `connectedFamilyIds`; la mia scheda "Albero" non lo faceva.
  Corretto con lo stesso filtro.

**Scoperte nel profilo altrui, completate davvero.** Mancava più di metà del wizard —
Carattere, Valori, Stile Di Vita, Materie Conosciute, Competenze, Abilità, Lingue Conosciute,
Film/Musica/Libri/Videogiochi Preferiti (con le loro miniature vere), Cibi Preferiti, Luoghi
D'Interesse, Categoria Preferita, Partner/Amici/Migliori Amici (risolti in nomi veri) — tutti
campi lista (`string[]`/`ThumbItem[]`) che la mappa delle etichette scalari non copriva
affatto. Corretta anche un'etichetta trovata incoerente nel farlo ("Giochi Preferiti" →
"Videogiochi Preferiti", per combaciare col wizard vero).

**Studia/Lavora.** "Dove Ha Studiato"/"Dove Ha Lavorato" (sempre visibili, come se chiunque
fosse sempre sia studente che lavoratore) sono diventati due spunte indipendenti — non si
escludono a vicenda, chi studia e lavora insieme esiste. Studia espande "Quale Scuola
Frequenta", "Obiettivi Di Studio Futuri", "Obiettivi Lavorativi Futuri" (guarda avanti, non
ancora un risultato). Lavora espande "Dove Lavora", "Lavori Precedenti" (ora una vera lista,
non un solo valore), "Dove Ha Studiato" (suggerito da "Quale Scuola Frequenta" solo la prima
volta che spunti Lavora, poi libero) e "Titolo Di Studio" (guarda anche indietro). Sotto,
Materie/Competenze/Abilità/Lingue e il resto proseguono uguali per tutti, indipendenti dalle
due spunte. Campo "Stress" eliminato ovunque (tipo, wizard, Scoperte, feed Novità, ricerca in
Mondo) — tre punti esterni che leggevano `workedAt` (il Resoconto Generale di Home, la
creazione automatica del marker Lavoro sulla Mappa, la ricerca testuale in Mondo) aggiornati
per usare `currentWorkplace`/`previousWorkplaces`.

Build verificata da zero dopo ogni blocco — compila ed è tipizzata correttamente.

## Checkpoint 20 — foto vere nei post, video incorporati, la gemma a due colori

**Le tue foto vere non comparivano mai nei post.** `PostCard` mostrava solo `demoPhotoUrl` —
un campo che esiste SOLO per i post dimostrativi (un url esterno). Le tue foto vere passano
invece da `photoKey` (una chiave verso `lib/image-store.ts`, IndexedDB) — mai risolta in
un'immagine vera, quindi ogni post con una tua foto reale la perdeva del tutto. Corretto con
lo stesso hook `useResolvedImage` già usato da `AuraAvatar`.

**Link incorporati.** Nessun campo nuovo nel compositore: se scrivi o incolli un link nel
testo del post, `lib/vitaecom-link-detect.ts` lo riconosce da solo alla visualizzazione, come
fanno la maggior parte dei social. YouTube e Vimeo diventano un vero player incorporato,
riproducibile sul posto. Qualunque altro link (Facebook compreso) diventa una card pulita col
dominio e un pulsante per aprirlo — una vera embed di Facebook richiederebbe il loro SDK e una
pagina pubblica raggiungibile in tempo reale, che qui non esiste: dichiarato, non un tentativo
di embed rotto che sembra un bug invece di un limite onesto.

**La gemma, due colori invece di uno.** Il contorno resta sempre il colore dello stato
d'animo DEL POST (di chi l'ha scritto); il riempimento, quando la metti tu, è il colore del
TUO stato d'animo attuale — rispetta lo stesso interruttore "Condividi Stato D'Animo Su
Vitaecom" del profilo, per coerenza: spento, il riempimento resta quello di "Normale" invece
di rivelare comunque come ti senti.

Build verificata da zero — compila ed è tipizzata correttamente.

## Checkpoint 21 — Persone, Sconosciuto/Persona Conosciuta, "Inizia A Conoscere", Chat vera

Il pezzo più grande di tutti in un solo checkpoint — un vero grafo sociale sopra Vitaecom,
costruito interamente sui dati locali di sempre (nessun backend, come dichiarato fin dal
Checkpoint 16).

**Ogni account, ora "Persona Conosciuta" o "Sconosciuto".** Un nuovo riquadro largo quasi
quanto lo schermo (stesso *breakout* della Vetrina) sotto la riga stato/genere di ogni
profilo altrui — non subito sotto, un margine apposta a separarlo dall'identità sopra — lo
dichiara e agisce di conseguenza: "Persona Conosciuta" con "Chat" accanto, simmetrici;
"Sconosciuto" resta centrale, con un pulsante — l'icona stessa di Vitaecom (`Aperture`) — a
sinistra che si espande in "Inizia A Conoscere" quando lo tocchi la prima volta, e manda
davvero la richiesta la seconda. Un account demo che l'accetta da solo dopo una manciata di
secondi (stessa idea già usata per Mi Piace/commenti sui post nuovi) è l'unico modo di
provare il flusso fino in fondo senza un vero account dall'altra parte — e una richiesta in
arrivo esiste già seminata al primo avvio, per provare subito anche "Accetta"/"Accetta E
Conosci Anche Tu" senza aspettare nulla.

**Per privacy, uno Sconosciuto non mostra i suoi post da nessuna parte** — né su Vitaeworld
né sul proprio profilo, non solo "non nel posto più ovvio". Cliccando il suo avatar (non più
il "..." che ora vive in alto a sinistra separato — vedi sotto) compare "Non Conosci Ancora
Questa Persona", ancorata e con un timer di 5 secondi che la richiude da sola.

**Il "..." al posto dell'avatar per Scoperte/Rapporto/Albero.** Tutto ciò che prima si apriva
cliccando l'avatar di un account altrui (il menù "Ultime Scoperte"/"Esplora Altro") ora si
apre da un piccolo pulsante a tre puntini in alto a sinistra dell'avatar — l'avatar stesso è
libero per il nuovo comportamento sopra (il pop-up "Non Conosci Ancora").

**Scheda "Persone" in navigazione**, tra Vitaeworld e Chat — identica a Mondo nel taglio
visivo, ma popolata solo dagli account che conosci davvero su Vitaecom (fonte diversa da
Mondo, mai confusa con quella). Le card hanno l'icona Chat al posto di WhatsApp, il telefono
solo se l'hai scoperto tramite la Persona eventualmente collegata (vedi Checkpoint 18).

**"Messaggi" è diventato "Notifiche"**, e non solo di nome: Mi Piace, commenti, richieste
"Inizia A Conoscere" e accettazioni finiscono tutti lì, oltre che in una nuova card in Home
(solo le non lette, al massimo 3). Le conversazioni sono ora vere (per chi conosci — vedi
`lib/vitaecom-chat-context.tsx`), non più un'anteprima spenta di tutti gli account demo:
scrivi, e dopo una manciata di secondi arriva una risposta simulata.

**Un altro bug della stessa famiglia, trovato scrivendo la card di Persone**: la card aveva
un `<Link>` (quindi un `<a>`) come contenitore esterno, con altri due `<a>`/`<Link>` annidati
dentro (telefono, chat) — un `<a>` dentro un altro `<a>` non è HTML valido, lo stesso identico
bug già corretto più volte in questa sessione per `<button>` annidati (PersonCard,
PersonalCardMenu). Stesso rimedio: un `<div role="button">` con la navigazione via router al
posto del `<Link>` esterno.

**Semplificazioni dichiarate**: "Accetta" e "Accetta E Conosci Anche Tu" portano allo stesso
risultato (la conoscenza reciproca) — con un solo utente vero in questa app, non c'è modo di
dare loro conseguenze davvero diverse senza inventarne una; restano due modi simmetrici di
dire sì, non due esiti diversi. La scheda Persone non ha filtri/ordinamento come Mondo: con
solo tre account dimostrativi possibili oggi, la lista è già corta abbastanza.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 18 rotte.

## Checkpoint 22 — lo spazzamento Title Case, completato su tutta l'app

Chiuso quello che era rimasto aperto da qualche checkpoint: ogni frase vera dell'app (non
etichette, non titoli di sezione, non pulsanti) ora rispetta davvero la regola stabilita al
Checkpoint 2 — maiuscola di sola frase, non Title Case.

**Trovato un secondo tipo di violazione, non solo quella già cercata**: le prime ricerche
cercavano solo dentro le stringhe tra virgolette — ma buona parte del testo dell'app vive
come testo JSX semplice, mai tra virgolette (`<p>Nessuna Task Attiva</p>`, non
`<p>{"Nessuna Task Attiva"}</p>`), e quella prima ricerca non lo vedeva affatto. Una seconda
ricerca mirata a questo pattern (testo dentro i tag, che finisce con un punto o un punto
esclamativo — il segnale più affidabile di una frase vera) ne ha trovate altre sedici, sparse
per quasi tutta l'app: messaggi di stato vuoto ("Nessuna Persona Trovata", "Nessun Impegno In
Programma", "Nessuna Spesa Futura In Programma", e una decina di altri identici nello
spirito), un paio di istruzioni, e tre messaggi d'errore in Vitaecom (`ImprimiMomento.tsx`)
mai toccati nei giri precedenti. Tutte corrette, con lo stesso criterio di sempre: "Vitaecom",
"Mondo", "Il Tuo Profilo", "Il Campo" (il Campo Energetico di Salute) restano nomi propri
anche dentro una frase minuscola; titoli di finestre/dialoghi ("Ti Senti Così?", "Quanto Hai
Speso?", "Eliminare Questa Task?") restano intestazioni, non frasi.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 18 rotte.

## Checkpoint 23 — la regola Title Case, corretta ancora: niente Title Case da nessuna parte

**Il Checkpoint 2 aveva lasciato un'eccezione che non doveva esserci.** La regola diceva:
maiuscola di sola frase per le frasi vere, ma Title Case ammesso per etichette, titoli di
sezione e pulsanti, perché "quelli sono nomi, non frasi". Corretto: non è così — l'eccezione
va tolta del tutto. Ora la maiuscola di sola frase vale ovunque nell'interfaccia: etichette dei
campi ("Ora Inizio" → "Ora inizio"), titoli di sezione, pulsanti, aria-label, placeholder,
intestazioni di finestre/dialoghi. Restano maiuscoli solo i nomi propri veri e propri — nomi e
cognomi, il nome dell'app ("Vitae") e del suo modulo sociale ("Vitaecom"), titoli di
film/libri/giochi scelti dall'utente, nomi di luoghi, il nome di un campo personalizzato — cioè
dati, non testo di interfaccia scritto da chi sviluppa. Passata tutta l'app: etichette dei
campi, titoli di sezione in wizard/rapporti/finanze/salute/task, testo dei pulsanti, aria-label
statici, placeholder. Dove un nome proprio compare dentro un'etichetta più lunga (es. "Ultime
Scoperte Su Vitaecom" → "Ultime scoperte su Vitaecom") solo il nome proprio resta maiuscolo.

**Sistemato anche nella stessa sessione, prima di questo giro** (non ancora in un checkpoint a
sé): il bug Soprannome/Nickname (`PersonalDetails.nickname` e `UserProfile.nickname`
coincidevano per via dell'`extends` — rinominato il primo in `alias`); rimossa la possibilità di
inserire un indirizzo nei campi "Quale Scuola Frequenta"/"Dove Lavora"/"Dove Ha Studiato" (ora
testo libero — perso di conseguenza il marker automatico su Mappa per questi campi, serviva
proprio la geocodifica dell'indirizzo); tutti gli inneschi di stato d'animo partono ora su
"Nessuno" al primo avvio invece di essere pre-popolati dal catalogo; suggerimenti dei Bisogni
ridotti da 15 a 2 + il campo libero; icona di "Sconosciuto" ingrandita.

**Portata reale del giro Title Case**, completato in più passate per non perdere pezzi: un primo sweep
automatico su tutti i file `.tsx` (etichette dei campi, pulsanti anche con icona+testo,
aria-label statici e con template, placeholder) ha convertito 178 stringhe in 74+ file. Una
seconda passata, più tollerante verso apostrofi in entità HTML (`&apos;`), trattini lunghi e
altra punteggiatura che la prima regex non riconosceva, ne ha trovate altre 61 sfuggite nella
prima battuta. Infine un giro a mano sui file `.ts` (le mappe di etichette dei Bisogni/Stati
d'Animo in `mood-catalog.ts`, `discovery-feed.ts`, `vitaecom-showcase.ts`,
`common-ground.ts`, `vitaecom-discoveries.ts`, i livelli di valutazione in `rating.ts` e
`relationship.ts`, le etichette di tipo/ricorrenza/promemoria task in `types.ts`, le due
etichette di categoria attività in `activity-catalog.ts`, un'etichetta di parentela in
`family-relations.ts`, e i messaggi d'errore rivolti all'utente in `use-live-location.ts`,
`nickname-check.ts`, `backup.ts`, `image-store.ts`) — questi non li vede nessuno sweep sulle
`.tsx` perché non sono JSX, sono stringhe TypeScript pure.

**Cosa NON ho toccato, apposta**: i cataloghi/vocabolari di tag selezionabili — Valori, Stile
Di Vita, Carattere/Interessi degli animali, Categorie Di Interesse, Categorie Di Spesa, i nomi
delle singole attività fisiche, i suggerimenti di Bisogni, le etichette dei campi
personalizzati d'esempio in `LinkAccountPanel.tsx`. Sono nomi di opzioni scelte dall'utente o
esempi di dati suoi, non testo istruttivo scritto da chi sviluppa — stesso trattamento già
riservato ai titoli di film/libri/giochi. Se anche questi vanno convertiti, dimmelo
esplicitamente: la distinzione è una scelta mia, non è scritta nel messaggio originale.

**Secondo giro, stessa sessione — altri residui trovati con una scansione più ampia**: il
primo sweep copriva solo `label=`/`title=`/`alt=`/`aria-label=`/`placeholder=` come stringhe
semplici — mancavano gli attributi con nome diverso (`hint=`, `description=`,
`colorLabel=`, `peopleLabel=`) e soprattutto qualunque valore dentro un'espressione
(ternari `cond ? "..." : "..."`, template con interpolazione) perché quelli non sono stringhe
semplici tra virgolette. Trovate e corrette un'altra quarantina di stringhe di questo tipo,
sparse tra wizard, task, persone, casa, mappa, mood e home — tutto verificato di nuovo con
build pulita. Fuori da questo secondo giro, lasciate come nel primo: cataloghi/vocabolari,
ed è rimasto un solo dato tecnico non testuale (viewBox e stroke-dasharray SVG) scambiato per
Title Case dalla scansione ma non toccato perché non è testo.

**Campi Data più larghi degli altri — causa trovata**: non era un problema del tipo di
campo, ma di layout — in tre punti (Aggiungi Spesa Singola, Aggiungi Spesa Futura, Registra
Attività) il campo Data stava da solo a piena larghezza subito sotto una riga a due colonne
(Nome+Importo, o Minuti+Calorie), quindi appariva doppio rispetto ai campi sopra. Corretto
inserendo anche lui in una riga a due colonne (la seconda colonna resta vuota). Verificato
anche Registra Peso: lì Peso/Data/Obiettivo erano già impilati alla stessa identica
larghezza, nessun problema reale — non toccato.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 19 rotte.

## Checkpoint 24 — zoom bloccato, validazione task, due Title Case sfuggiti fuori dalle .tsx

**Zoom bloccato ovunque tranne mappa e immagini.** Il `maximumScale: 1` nel viewport avrebbe
bloccato lo zoom anche lì dove doveva restare attivo — rimosso. Al suo posto, `touch-action:
pan-x pan-y` su `html, body` (blocca pizzico e doppio tap in tutta l'app, senza dipendere da
`user-scalable=no` che iOS spesso ignora), con `touch-action: auto` ripristinato su
`.leaflet-container` (la mappa) e su ogni `<img>` (le immagini) per lasciare lo zoom nativo
lì.

**Task con data, orario di inizio e orario di fine (Evento/Appuntamento — il gruppo "tempo"
di `taskGroup`) ora richiedono almeno data e orario di inizio per essere create**; l'orario di
fine resta facoltativo, come richiesto. Promemoria/Obiettivo/Spesa non sono toccate: hanno una
forma diversa (due coppie data+ora) e non erano nella richiesta.

**Campi Data troppo larghi**: causa trovata — non il tipo di campo, il layout: in tre punti
(Aggiungi Spesa Singola, Aggiungi Spesa Futura, Registra Attività) il campo Data stava da solo
a piena larghezza subito sotto una riga a due colonne. Corretto inserendolo anche lui in una
riga a due colonne. Registra Peso non aveva il problema (già tutto alla stessa larghezza).

**Due Title Case sfuggiti perché fuori da qualunque file `.tsx` o `.ts` di componente**: la
tagline "La Tua Vita, Vissuta Due Volte." viveva sia nei metadata di `app/layout.tsx` sia in
`public/manifest.json` (nome e descrizione dell'app per la schermata Home e per il prompt
d'installazione) — nessuno sweep precedente guarda dentro `manifest.json`. Corretta in
entrambi i punti.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 19 rotte.

## Checkpoint 25 — Albero Genealogico, una scheda tutta sua

**Separato da Rapporti**, come richiesto esplicitamente ("altrimenti viene meno la
possibilità di scoprire man mano una persona attualmente sconosciuta" non c'entra qui — quel
punto riguarda Mondo/Persone, non l'Albero, ma la richiesta di scheda separata era chiara di
suo). Prima l'Albero era un secondo tab interno alla pagina `/rapporti` (stato locale
`tab`); ora è la sua rotta a sé, `/albero`, raggiungibile dalla barra di navigazione (nel menu
"Altro", accanto a Rapporti) — non più nascosto dentro un'altra scheda. Spostata anche la
rotta di dettaglio dell'albero di una persona, da `/rapporti/albero/[id]` a `/albero/[id]`,
con tutti i link aggiornati (da `FamilyMenu`, da `ExploreProfileSheet`, e i link interni della
pagina stessa quando salti da un parente all'altro). Il link "Torna Ai Rapporti" nella pagina
di dettaglio ora dice "Torna all'albero" e riporta a `/albero`, non più a `/rapporti` — coerente
con l'essere entrato lì dalla sua scheda, non da Rapporti.

`/rapporti` resta con la sola vista Rapporti (griglia/costellazione, filtro amicizia/inimicizia,
solo animali) — nessuna perdita di funzionalità, solo il secondo tab tolto perché ora vive
altrove.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 21 rotte (due in
più di prima: `/albero` e `/albero/[id]`).

## Checkpoint 26 — creare una task crea l'evento nel calendario di sistema

**Non esiste un'API browser per scrivere direttamente nel calendario di Android/iOS** — questa
è una PWA, non un'app nativa, e nessun sito web può farlo davvero. La strada standard, che
qualunque sito "Aggiungi Al Calendario" usa, è generare un file `.ics` e farlo aprire dal
browser: sia Android che iOS riconoscono il tipo e offrono da soli "Aggiungi al calendario",
con un tocco di conferma dell'utente — lo stesso identico comportamento richiesto, dichiarato
qui per lo stesso motivo per cui ho dichiarato l'embed di Facebook al Checkpoint 20: una
scelta onesta, non un tentativo rotto che sembra un bug.

**Creare una task di qualunque tipo, eccetto "Attività Quotidiana"**, genera ora l'evento:
`lib/ics.ts` costruisce il file rispettando data, orario di inizio e orario di fine. Per il
gruppo "tempo" (Evento/Appuntamento): Data+Ora Inizio → inizio evento, Ora Fine (se c'è) →
fine, altrimenti un'ora di durata di default. Per il gruppo "scadenza"
(Promemoria/Obiettivo/Spesa): Data Inizio+Ora Inizio → inizio, Data Scadenza+Ora Scadenza (se
ci sono) → fine — stessa logica, campi diversi. Senza alcun orario, l'evento diventa "tutto il
giorno" sulla sola data. "Attività Quotidiana" resta esclusa, come richiesto: si ripete da sola
ogni giorno, un evento di calendario non aggiungerebbe nulla.

`addTask` ora restituisce la task appena creata (prima non restituiva nulla) — serviva per
generare l'.ics con l'id vero. Aggiornare una task esistente non ri-genera l'evento: la
richiesta parlava di creazione, non di modifica.

**Trovata un'altra Title Case sfuggita**: "Nuova Task" nel titolo del modale di creazione.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 21 rotte.

## Checkpoint 27 — video nei post, e la finestra di ridimensionamento foto resta ferma

**Non c'era un pulsante per caricare un video nella creazione del post — ora c'è.** Nuovo
`lib/video-store.ts` (IndexedDB, stesso identico pattern di `image-store.ts` — un video in
localStorage come base64 diretto avrebbe saturato la quota all'istante), collegato al backup
(`lib/backup.ts` ora esporta e ripristina anche i video, non solo le immagini). Nuovo
`VideoPickerInput` (nessun ritaglio, a differenza delle foto — non ha senso per un video).
`VitaecomPost` ha un `videoKey` accanto a `photoKey`; foto e video sono a scelta alternativa,
mai insieme sullo stesso post.

**Ridotti i pulsanti di importazione foto e video a due icona-pulsante**, come richiesto: prima
c'era un unico pulsante largo con testo ("Aggiungi Una Tua Foto"); ora sono due pulsanti-icona
quadrati (fotocamera, videocamera) — quando ne scegli uno l'altro sparisce (foto e video restano
alternativi) e il pulsante scelto diventa "cambia" + una X per rimuovere, sempre due pulsanti
in tutto, mai di più.

**Video riproducibili**: `PostCard.tsx` (l'unico componente che renderizza i post — usato da
Vitaecom, dal profilo Vitaecom e dal profilo di ogni account) ora mostra un elemento `<video>`
vero con controlli, quando il post ha un video invece di una foto.

**Finestra di ridimensionamento foto (ovunque nell'app, non solo nel wizard di scoperta —
`ImageCropInput` è condiviso)**: bloccato lo scroll della pagina sotto finché la finestra resta
aperta, così non si sposta più rispetto allo schermo e non serve più scrollare per raggiungerla.
Si sblocca da sola alla conferma o all'annullamento.

Build verificata da zero — compila ed è tipizzata correttamente su tutte le 21 rotte.

## Checkpoint 28 — rilettura del brief originale: Mondo↔Vitaecom, barra di navigazione, notch, icona

Ripartito dal brief originale per intero (non nuove segnalazioni: lo stesso testo di
sempre, riletto da capo per trovare cosa mancava ancora rispetto a tutti i checkpoint
precedenti). Molti punti risultavano già coperti da checkpoint passati — verificati nel
codice uno per uno prima di toccare qualunque cosa, non dati per scontati: bug
soprannome/nickname, dimensioni barra di navigazione offline vs online, indirizzo nei campi
Studia/Lavora, campi Data larghi, stati d'animo di default "Nessuno", suggerimenti Bisogni
ridotti a due, blocco dello zoom, Albero separato da Rapporti — tutti già a posto, nessun
intervento necessario. Quello che segue è invece quanto mancava davvero.

**Eliminato il collegamento tra un account Vitaecom e una Persona di Mondo**, come richiesto
esplicitamente: teneva in vita un ponte che sarebbe comunque dovuto sparire il giorno
dell'unione tra Mondo e Persone (la direzione dichiarata), e nel frattempo toglieva senso a
scoprire man mano una persona oggi ancora sconosciuta. Rimossi `LinkAccountPanel.tsx` e
`accountLinks`/`linkAccountToPerson`/`unlinkAccount` da `vitaecom-social-context.tsx`;
`ExploreProfileSheet` non ha più le tre schede Scoperte/Rapporto/Albero pescate da una
Persona presa in prestito — ora dichiara con onestà che arriveranno quando Mondo e Persone
diventeranno un'unica scheda, invece di mostrare tre schede vuote o dati non suoi.

**Le vetrine dei profili altrui, ora visibili per davvero.** Non potendo più pescare da una
Persona collegata, i tre account dimostrativi hanno una propria vetrina statica (gli stessi
dati curati a mano che stavano nel pannello di collegamento appena tolto — occupazione,
un paio di tratti scelti per Nina/Leo/Sara), mostrata a chi visita il loro profilo tramite
lo stesso componente `ShowcaseDrawer` del proprietario. La Vetrina ora parte davvero da
sotto il notch su entrambe le pagine profilo: il pulsante Indietro/Home, quando in flusso la
spingeva più in basso, è diventato un cerchietto flottante ancorato al safe-area,
sovrapposto al suo bordo — lo spazio del notch lo porta ora la Vetrina stessa (o un semplice
spaziatore, quando un account ospite non ne ha una: mai un riquadro "Vetrina" finto e vuoto).

**Il tocco lungo non apre più il menu del browser.** Mancava una regola di base
(`-webkit-touch-callout`/`user-select` su pulsanti e link): il gesto lungo dell'app veniva
scavalcato dal fermo-immagine di iOS o dal menu contestuale. Corretto globalmente, non solo
nel punto segnalato.

**La barra di navigazione "offline" è ora personalizzabile con una pressione lunga**, come
richiesto: le tre schede della fila principale (tutte tranne Home e "Altro", sempre fissi)
si possono sostituire tenendole premute — si apre un selettore con tutte le altre schede non
già assegnate a un altro slot, e quella scelta prende il posto della vecchia, che torna da
sola nel pannello "Altro" (che è semplicemente "tutto ciò che oggi non è in nessuno dei tre
slot", non un secondo elenco da tenere sincronizzato). Preferenza persistita in locale.

**Tre transizioni per le barre di navigazione**, tutte richieste esplicitamente:
- Passando dalla barra "offline" a quella "online" (e viceversa) la pillola gira su se
  stessa (`rotateY`) mentre l'altra prende il suo posto, invece di sparire e ricomparire di
  scatto — le due restano montate insieme per la durata della transizione (`AnimatePresence`
  in `NavSwitcher`).
- L'alone viola dietro la scheda attiva è ora un solo elemento condiviso (`layoutId`) che
  scivola da una scheda all'altra quando cambi pagina, non una ricolorazione istantanea —
  stesso meccanismo su entrambe le barre, con un `layoutId` diverso a testa per non
  confonderle tra loro.
- Le barre sono ora visibilmente più traslucide (nuova classe `.glass-nav`, sfondo molto più
  trasparente di `.glass-strong`) con un effetto di distorsione vero sui colori sottostanti
  (`saturate` insieme al blur, non solo sfocatura) — lo stesso linguaggio "liquid glass",
  applicato solo alle barre, non a modali e fogli che restano `.glass-strong` come prima.

**Bug Casa/Fuori Casa con la geolocalizzazione, corretto.** Un Impegno/Evento "Fuori Casa"
aveva sempre l'ultima parola sulla posizione dell'utente, anche quando il GPS confermava che
era fisicamente a Casa — esattamente il caso segnalato. Ora la geolocalizzazione, quando il
rilevamento è attivo e ha una lettura vera, vince sempre sul dato dedotto dalla task; la task
resta valida per tutto il resto (rilevamento spento, o il GPS stesso conferma che sei
altrove).

**"Altro" in Carattere, Valori, Stile Di Vita e Categoria Preferita**, nello stesso formato
di selezione delle altre voci: un chip in fondo alla fila che, toccato, si trasforma sul
posto in un campo di testo da confermare (invio o l'icona di spunta) — il valore scritto
viene aggiunto e selezionato subito, un'unica modifica condivisa in `TagMultiSelect` che
copre tutti e quattro i punti in un colpo solo.

**I Bisogni generano anche uno stato d'animo "desiderato", non solo "Appagato".** Sceglierne
uno nuovo (dal suggerimento o scritto a mano) ora aziona anche un proprio innesco — di serie
"Curioso", configurabile come ogni altro innesco nel pannello degli Stati D'Animo — accanto
a quello già esistente per quando lo esaudisci.

**Anche i tag notificano l'utente taggato.** Nuovo tipo di notifica "tag": un post
dimostrativo (quello di Sara con la foto ritrovata) ti tagga davvero e genera la notifica
alla primissima apertura di Vitaecom, gestita in entrambi i punti dove le notifiche compaiono
oggi (la card in Home e la finestra "Notifiche" dentro Chat).

**Icona dell'app aggiornata su Android e iOS**: "Vitae" dove il puntino della "i" è una vera
sfera di stato d'animo, con un bagliore morbido intorno nello stesso linguaggio "Aura" di
avatar e mappa — sfondo scuro con due aloni radiali (violetto e ciano) coerenti col resto
dell'app, verificato anche ritagliato a cerchio (l'icona "maskable" di Android non taglia
nulla di importante).

**Tre punti del brief restano apposta senza una riga di codice, in attesa di una decisione
insieme**, non dimenticati: il processo di segnalazione di un post (prima/dopo la
segnalazione — non è una scelta che dovrei fare da solo), un controllo automatico dei
contenuti sessualmente espliciti in foto/video (non costruibile con onestà in questa app
solo-locale, senza un vero servizio di moderazione dietro), e il brainstorming sulle stories
verticali stile TikTok.

**Il resto del brief, ancora da fare** — la parte più grossa e più interconnessa, rimandata
apposta a un giro suo: la barra di testo della chat con i pulsanti multimediali e la sua
trasformazione dalla barra di navigazione; le reazioni ai messaggi in chat (stato d'animo,
fusione liquida dei colori, animazione dell'avatar); il tasto "+" del riquadro Casa collegato
a Vitaecom (Da Vitaecom/Offline/Animali, con richiesta e accettazione reciproca); separare il
wizard di creazione Persone da quello degli Animali; l'intero sistema "Lato Stato" (reazioni
sui post, ri-condivisione con "Cosa provi?", le notifiche che ne derivano); il menu a tre
puntini sui post; il visualizzatore di immagini a schermo intero in Vitaecom; l'animazione
di scroll del profilo (Vetrina che si ritira nell'avatar in alto); la scheda "News"; le
notifiche interne che funzionano anche ad app chiusa (limite di piattaforma da confermare,
come già discusso per la geolocalizzazione).

Build verificata da zero (`npm install` + `npm run build`) dopo ogni blocco — compila ed è
tipizzata correttamente su tutte le 21 rotte.

## Checkpoint 29 — separazione Persone/Animali, e il tasto "+" della Casa diventa "Aggiungi:"

**Wizard di creazione Persone separato da quello Animali, come richiesto.** "Aggiungi
Persona" non mostra più Cane/Gatto tra le opzioni di tipo (`AddPersonModal` filtra ora i
tipi umani a meno che non sia esplicitamente in modalità animale); Mondo ha un secondo
pulsante "+ Animale" accanto a "+ Persona", che apre lo stesso modale in modalità dedicata.

**Il tasto "+" del riquadro Casa, evoluto in "Aggiungi:".** Non apre più direttamente il
vecchio wizard: si apre invece una finestrella ancorata alla sua posizione (stesso pattern
già usato per il menù della card personale — portal su `document.body`, coordinate reali) con
tre strade — "Da Vitaecom", "Offline", "Animali" — esattamente come richiesto. "Offline" e
"Animali" aprono il wizard (ora davvero) dedicato, con la Casa già impostata. "Da Vitaecom"
apre un nuovo pannello sulle tue Persone Conosciute: toccare una card la inspessisce e apre
il pulsante "Scegli"; "Scegli" controlla che tu conosca almeno nome e cognome di quella
persona — se non lo conosci ancora, l'errore "Devi Almeno Conoscere Il Suo Nome!" compare
accanto al pulsante, con un modo rapido per rimediare sul posto.

**Il "wizard delle scoperte" minimo per gli account Vitaecom.** Non esisteva alcun posto
dove registrare "conosco il nome vero di questo account" dopo aver tolto il ponte verso una
Persona di Mondo (Checkpoint 28) — aggiunto un piccolissimo pezzo nuovo (`knownNames` in
`vitaecom-social-context.tsx`): oggi solo Nome e Cognome, il minimo che questa richiesta
specifica serve a verificare. Il seme di quello che sarà, quando Mondo e Persone si
uniranno, la vera scheda Scoperte di ogni account.

**L'appartenenza alla Casa, reciproca come conoscersi.** Confermata la scelta, parte una
richiesta all'account scelto — simulata con la stessa idea già usata per "Inizia A
Conoscere": un account demo che accetta da solo dopo qualche secondo (l'unico modo di
provare il flusso fino in fondo senza un vero account dall'altra parte), più una richiesta
in arrivo già seminata per provare subito anche "Accetta"/"Rifiuta" come destinatario. Due
nuovi tipi di notifica ("[nickname] Desidera Aggiungersi Nella Tua Casa" / "è entrato/a
nella tua Casa"), visibili sia nella card di Home sia nella finestra Notifiche, con i
pulsanti Accetta/Rifiuta proprio lì per la richiesta in arrivo.

**Gli account Vitaecom nel riquadro Casa hanno un loro avatar**, con lo stesso linguaggio
Aura di una Persona di Mondo — ma toccarlo apre un piccolo menù, non una scheda Persona: "Vai
al profilo" (la sua vera pagina Vitaecom) e "Dissocia dalla Casa" al posto di "Elimina
persona", con la conferma richiesta ("Vuoi Davvero Dissociare [Nome Cognome] Da Casa?").
Dissociare rimuove il legame solo sul tuo dispositivo — l'unico che esiste davvero in
questa app solo-locale; "anche dal suo lato" non è rappresentabile per un account demo senza
un dispositivo proprio, stesso limite onesto già dichiarato fin dal Checkpoint 16.

**"I movimenti Casa-Fuori Casa sono visibili", anche per chi non ha un vero GPS.** Un account
Vitaecom nel tuo riquadro Casa non è fermo per sempre in un solo posto: la sua posizione
cambia da sola nel tempo (deterministica per account e quarto d'ora, non un
`Math.random()` diverso a ogni apertura) — l'idea vera di qualcuno che si muove, dichiarata
come simulazione nel codice, non un finto GPS spacciato per vero.

Bug trovato e corretto scrivendo questo pezzo, prima di consegnare: `useVitaecomSocial()`
era stato chiamato dopo l'`if (...) return null;` di `HomePage` — un hook chiamato solo a
volte, non ad ogni render, viola le regole di React anche quando il build non lo segnala
subito. Spostato in cima insieme agli altri hook del componente.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 21 rotte.

## Checkpoint 30 — il sistema "Lato Stato": reazioni, condivisione vera, e un giro di pulizia Title Case

**Condividere un post ora è un vero gesto, non più una riga generata da sola.** "Condividi"
apre un foglio dove scrivere qualcosa di tuo, con "Cosa provi?" — obbligatorio, è quello che
finisce sotto il nickname ("si è sentito/a [stato d'animo]") e alimenta il Lato Stato della
catena — e, solo quando il post che stai condividendo aveva a sua volta una propria aggiunta
scritta durante una condivisione precedente, l'interruttore "Incorpora anche il contenuto
aggiunto da [nickname]". Il contenuto dell'originale si incorpora sempre, senza bisogno di
un interruttore; quello del post di provenienza mai oltre un livello, esattamente come
richiesto ("mai quello prima"). Alla fine della condivisione riappare il Pop Up "Ti Senti
Così?" già esistente, pre-selezionato sullo stato appena scelto (`suggestMood` in
`mood-context.tsx`, che riusa lo stesso popup con un candidato deciso al volo invece che
pescato dalla mappa inneschi) — resta comunque un suggerimento da confermare, mai imposto.

**Il "Lato Stato".** Il lato sinistro della cornice di un post, spezzato dal resto del bordo,
si popola con una linea di colore per ogni stato d'animo provato da chi ha condiviso o
reagito lungo tutta la catena — dall'originale fino all'ultima condivisione, tutte
collegate allo stesso conteggio (`moodTallies` in `vitaecom-social-context.tsx`, indicizzato
per la radice della catena, non per il singolo post). Quando le linee non ci stanno più
tutte, restano solo quelle con il numero più alto di persone — e si aggiornano da sole se una
quota supera la più bassa già in classifica. Toccare una linea apre una finestra ancorata con
scritto "[n] persone si sono sentite [stato d'animo]".

**Reazioni sui post.** Una sfera accanto al pulsante di condivisione, identica a quelle dei
pop-up degli stati d'animo — toccandola si apre lo stesso selettore usato per "Cosa provi?"
(componente condiviso, `MoodPicker.tsx`); scelto uno stato, la sfera si colora gradualmente e
una sferetta più piccola cade e schizza verso il Lato Stato, dove la linea corrispondente si
illumina (o nasce, se non c'era ancora). La reazione aggiorna la stessa quota condivisa da
tutta la catena. Una nota onesta su una scelta di semplificazione: quando lo stato reagito
non fa il "taglio" delle linee visibili, la sferetta sparisce comunque al bordo senza una sua
animazione di risucchio dedicata — il dettaglio più sottile dell'idea originale, lasciato
fuori per restare dentro tempi ragionevoli.

**Le reazioni generano una notifica vera.** "Il tuo post ha reso [nickname] [stato d'animo]"
— dato che solo il tuo dispositivo esiste per davvero in quest'app solo-locale, l'unico modo
onesto di provare il flusso è lo stesso già usato per Mi Piace e commenti: un account demo
che reagisce a un tuo post appena pubblicato dopo una manciata di secondi (ora un terzo
esito possibile di `simulateDemoEngagement`, accanto a Mi Piace e commento), che notifica sia
te come autore di quel post sia l'autore dell'originale quando è sempre tu (es. hai condiviso
una tua vecchia foto) — mai un account demo, che non ha un dispositivo su cui vederla.

**Un giro di pulizia sulla maiuscola di sola frase.** Scrivendo in fretta i componenti dei
Checkpoint 28 e 29 erano rientrate diverse violazioni della regola stabilita al Checkpoint
23 — corrette tutte dopo una segnalazione diretta, con una scansione mirata (non solo a
occhio) su ogni file toccato in queste ultime sessioni: i saluti e le descrizioni delle
Scorciatoie in Home, il filtro di Mondo, i testi del picker "Da Vitaecom" e della Casa, le
notifiche di appartenenza alla Casa, il pannello "Esplora Altro" — e due violazioni
preesistenti nella pagina del profilo altrui, trovate per lo stesso motivo pur non essendo
mie. D'ora in avanti la stessa scansione fa parte del controllo prima di consegnare, non solo
una lettura a occhio.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte statiche/dinamiche.

## Checkpoint 31 — il menu a tre puntini sui post

**Ogni post ha ora il pulsante a tre puntini in alto a destra**, come richiesto. Su un tuo
post, l'unica voce è "Elimina post". Su un post altrui, due voci distinte: "Non mi interessa
questo post" (lo toglie dal tuo Vitaeworld e da qualunque profilo lo mostri, solo per te —
non è una segnalazione, dall'altra parte non succede nulla) e "Nascondi tutti i post di
questo utente" (niente più suoi post ovunque compaiano, e smette anche di essere scelto dalla
simulazione di Mi Piace/commento/reazione sui tuoi post — niente più sue notifiche future).
Entrambi i filtri sono persistiti in locale e si applicano ovunque i post vengono elencati:
Vitaeworld, il profilo altrui, e filtrano anche le notifiche già arrivate da un account
appena messo a tacere.

"Segnala questo post" manca apposta, non per dimenticanza: il processo di segnalazione —
cosa vede chi segnala, cosa succede dopo — resta tra le cose da decidere insieme prima di
costruirlo, esattamente come discusso.

Nel farlo, trovato e corretto un altro `share()` rimasto rozzo: la scheda Vitaeworld
generava ancora una condivisione a una riga con `publish()` invece di aprire il vero foglio
"Condividi" costruito al Checkpoint 30 — sfuggito perché quel giro aveva toccato solo la
Bacheca e il profilo altrui, non Vitaeworld. Ora anche lì apre `ShareComposer`.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte.

## Checkpoint 32 — il visualizzatore di immagini a schermo intero

Toccare la foto di un post (non su una condivisione, dove il contenuto vero è quello
incorporato — vedi sotto) apre ora `ImageViewer.tsx`: sfondo completamente buio con aloni di
colore di una palette "tipo inverno" (ghiaccio, non i violetti/ciano dell'Aura solita —
qui è solo lo sfondo di una foto, non deve competere con lei) che si muovono in loop ai
margini, mai sul lato sinistro, dove compare invece il Lato Stato a schermo intero, cliccabile
esattamente come sul post. L'immagine sta al centro secondo il suo rapporto, zoomabile con un
pizzico a due dita (o la rotella su desktop) senza scatto di ritorno — resta dove la lasci
finché non chiudi. Toccare lo schermo in un punto qualunque apre la finestra informazioni in
basso, molto traslucida: nickname, gemma/commento/condividi, e il testo del post minimizzato
a due righe con un "espandi" quando serve.

Non ancora esteso alle immagini incorporate dentro una condivisione (l'originale e l'eventuale
aggiunta del post di provenienza, dentro `EmbeddedPost` in `PostCard.tsx`) — solo alla foto
principale di un post che non è esso stesso una condivisione: un primo passo solido, non
tutta la superficie possibile.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte.

## Checkpoint 33 — l'animazione di scroll del profilo altrui

Scorrendo verso il basso nel profilo di un altro utente, un riquadro fisso (sotto il notch,
dove prima stava solo "Indietro") prende gradualmente il posto di vetrina, riquadro
centrale, nickname e stato d'animo: l'avatar si rimpicciolisce e la sua aura svanisce prima
di lui, poi — verso la fine della corsa — compaiono nel riquadro l'avatar in miniatura, la
freccia indietro alla sua sinistra e il nickname alla sua destra. Il riquadro si riempie con
un effetto liquido nel colore dello stato d'animo, fino a tre quarti della sua altezza, con
un guizzo più acceso a ogni scroll che si assesta da solo quando ti fermi. Tornare in cima
rifà tutto al contrario da sé, senza codice apposta per il verso inverso: l'intera
transizione è una funzione diretta della posizione di scroll (`ProfileHeader.tsx` accetta ora
un `collapseProgress` opzionale, mai passato dal proprio profilo — lì non si raccoglie nulla),
non un interruttore che scatta una volta sola.

Una nota onesta sulla soglia di scroll: il punto "il primo post arriva all'altezza
dell'avatar" è approssimato con un valore fisso di pixel invece che misurato dal vero — una
misura live si romperebbe proprio nei casi limite (zero post, tanti post), una soglia
ragionevole resta solida ovunque.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte.

## Checkpoint 34 — la barra di navigazione diventa barra di testo dentro una chat

Entrando nella conversazione con una Persona Conosciuta, la barra di navigazione "online" si
capovolge (stessa animazione `rotateY` già usata per il cambio offline/online, non una nuova
— vedi `NavSwitcher.tsx`, che ora sceglie tra tre barre in base al percorso, non più due) e
al suo posto compare una barra di testo vera: freccia indietro all'estrema sinistra (torna
alla scheda Chat, il che fa scattare da solo il capovolgimento inverso — nessuno stato da
invertire a mano, `NavSwitcher` sceglie sempre la barra giusta in base al percorso), il campo
di testo, due pulsanti-icona per allegare una foto o un video (mutuamente esclusivi, stesso
formato già stabilito per "Imprimi Momento") e l'invio. Prima non c'era alcun modo di
condividere file multimediali da qui: mancava del tutto.

La barra resta fissa durante lo scroll come già faceva quella di navigazione, e ora reagisce
anche alla tastiera virtuale (`lib/use-keyboard-inset.ts`, tramite `visualViewport` — l'unica
API che riflette davvero quanto spazio la tastiera toglie), restando sopra di lei invece di
finirci nascosta sotto.

Nel farlo, un'altra violazione Title Case preesistente trovata e corretta nella stessa pagina
("Conosci Prima..." nel messaggio per chi non conosce ancora la persona).

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte.

## Checkpoint 35 — reazioni ai messaggi in chat, e l'aura fiammeggiante dell'avatar

**Ogni messaggio è reagibile con uno stato d'animo**, stessa meccanica dei post: una sfera
sotto il messaggio (nome dello stato al posto della sfera una volta reagito, sempre
cliccabile per cambiarlo) genera "Ti sei sentito/a [stato]" quando reagisci tu, "Si è
sentito/a [stato]" quando reagisce l'altro lato (simulato — vedi sotto), e "Vi siete
sentiti" con le due sfere sovrapposte, cliccabili in un elenco, quando reagite entrambi. Il
contorno del messaggio prende il colore dello stato di chi ha reagito; se avete reagito
entrambi con stati diversi, diventa un gradiente liquido dei due colori (stessa animazione
già costruita per il Lato Stato dei post, non un secondo linguaggio visivo).

Non esistendo un vero interlocutore dall'altra parte del filo, la sua reazione è simulata
con la stessa onestà già usata altrove: dopo un tuo messaggio, l'account demo a volte reagisce
con uno stato invece di rispondere a parole (mai entrambe le cose insieme).

**L'avatar dell'altro account, in chat, non ha più l'aura permanente** — l'aveva sempre
avuta per errore di distrazione, non per scelta: ora è spenta come richiesto. Quando arriva
una sua reazione, si accende invece un'animazione (`ReactionAvatarBurst.tsx`): il tasto
indietro si trasforma in una sfera dello stato d'animo, raggiunge il bordo dell'avatar, lo
gira una volta intera, torna al punto di partenza e ridiventa freccia — poi un'aura
fiammeggiante esplode intorno all'avatar con scintille bianche e del colore dello stato,
dura un secondo e scompare per sempre (non un nuovo respiro continuo). Circa due-tre secondi
in tutto, come richiesto.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 19 rotte.

## Checkpoint 36 — la scheda "News"

Nuova scheda "News", assegnabile a uno slot della barra di navigazione con la stessa
pressione lunga già costruita per personalizzarla (o raggiungibile da "Altro", come ogni
scheda non assegnata). Notizie vere, non finte: quattro categorie (Attualità, Cronaca,
Cultura, Tecnologia) lette da RSS pubblici di ANSA, un'agenzia di stampa — non un singolo
giornale schierato — con visuale a scorrimento verticale dentro ciascuna categoria e i tab
delle categorie scorrevoli in orizzontale sopra. Ogni notizia mostra il testo così come
arriva dal feed, minimizzato a due righe con un tasto "Espandi"; l'immagine, quando il feed
la fornisce (non sempre: molti articoli ANSA non ne hanno una nel feed stesso); e due azioni,
condividere su Vitaecom o aprire l'articolo vero per intero sul sito di origine. Il recupero
gira lato server (`/api/news`), sia perché il browser non potrebbe leggere questi feed per il
CORS della fonte, sia per non rifare la stessa chiamata a ogni apertura (cache di 10 minuti).

**Condividere una news su Vitaecom** apre un piccolo foglio per aggiungere un pensiero
facoltativo; il link vero finisce nel testo del post e viene riconosciuto ed incorporato
dallo stesso `LinkEmbed` già usato per qualunque link scritto in un post — nessun componente
nuovo, nessuna finta identità sul post: rimanda sempre alla fonte.

**Una nota onesta, non solo tecnica.** Il servizio RSS di ANSA dichiara esplicitamente di
essere pensato "per fini non commerciali... per la sola visualizzazione mediante... Reader" —
esattamente quello che questa scheda fa (un lettore personale per un solo utente, mai
distribuito né monetizzato), non una ripubblicazione dei loro contenuti come se fossero
nostri: per questo ogni notizia porta solo titolo e la breve descrizione già presente nel
feed stesso — mai un testo integrale scaricato dalla pagina dell'articolo, che tra l'altro
ANSA non mette nemmeno nel proprio RSS — e rimanda sempre all'originale per leggerlo davvero.
Se in futuro questa scheda dovesse crescere (altre fonti, testi più lunghi), vale la pena
riguardare insieme i termini d'uso della fonte scelta prima di procedere, non darli per
scontati una volta e basta.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 21 rotte.

## Checkpoint 37 — "Segnala questo post", e una nota sul futuro con un server vero

**Prima, un'indicazione importante ricevuta e da tenere a mente d'ora in avanti**: quest'app
dovrà un giorno passare a più persone collegate tra loro da un server vero — non resterà per
sempre solo-locale con un utente reale e account dimostrativi. Non cambia nulla in quello già
costruito, ma cambia come conviene progettare quello che manca ancora: dati e scelte fatte
oggi pensando già a quel domani, invece di lasciare che tutto vada ripensato da capo quando
arriverà.

La prima conseguenza pratica: **"Segnala questo post"**, lasciato apposta in sospeso al
Checkpoint 31. Un motivo tra quelli previsti (Contenuto inappropriato, Molestie o bullismo,
Spam o inganno, Nudo o contenuto sessuale, Violenza, Altro — quest'ultimo con un campo
libero), poi la conferma. Oggi la segnalazione resta solo sul tuo dispositivo — non esiste
ancora un server dove mandarla né un moderatore che la legga — ma la sua forma (`PostReport`
in `vitaecom-social-types.ts`: chi, cosa, perché, quando) è già quella che un giorno
viaggerà verso una vera coda di moderazione: quando quel server esisterà, sarà da spedire,
non da ripensare. Segnalare nasconde anche il post dal tuo Vitaeworld, una scelta ragionevole
più che una regola — difficilmente vuoi ancora vederlo dopo averlo segnalato.

Restano in sospeso, e per motivi diversi tra loro: la moderazione automatica dei contenuti
sessualmente espliciti (serve comunque un vero servizio di visione artificiale lato server —
ora so che un giorno esisterà, ma "un giorno" non è "ora"), e le stories verticali (restano
un brainstorming da fare insieme prima di costruire qualcosa).

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 21 rotte.

## Checkpoint 38 — "Segnalazioni" arriva solo a te

Confermato: le segnalazioni devono arrivare a te, e solo a te — gli altri account non hanno
questa sezione. Nuova pagina `/segnalazioni` con l'elenco di ogni post segnalato (chi,
perché, un'anteprima del post), e due azioni per ciascuna: "Segna come esaminata" (la toglie
dalla lista senza toccare il post, che intanto è già nascosto dal tuo Vitaeworld da quando
l'hai segnalato) o "Elimina il post" per davvero.

Per questo non vive tra le schede assegnabili della barra di navigazione insieme a tutte le
altre — quelle sono la superficie che un domani, con account reali multipli, sarà la stessa
per chiunque; questa no. Si raggiunge da un piccolo pulsante dedicato, ancorato al tuo
profilo Vitaecom (lo stesso angolo dove i profili altrui hanno "Esplora Altro"), con un
puntino quando c'è qualcosa da esaminare.

**Una precisazione onesta, non un dettaglio da nascondere**: oggi questa restrizione è solo
"non è nella navigazione normale", non un vero controllo d'accesso — in un'app solo-locale
con un solo account reale non ce n'è bisogno, e nasconde un link non è mai sicurezza vera.
Quando arriveranno account reali multipli tramite il server di cui abbiamo parlato, questa
sezione andrà ristretta per davvero lato server — un lavoro suo, non qualcosa che si risolve
da solo perché oggi il link non compare nei menu.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 22 rotte.

## Checkpoint 39 — le storie verticali, l'ultimo pezzo del brief originale

Dopo il brainstorming fatto insieme: una storia è a tutti gli effetti un post (stesso tipo
`VitaecomPost`, solo con `isStory`/`expiresAt` in più) — per questo riceve "tutte le
interazioni di un post normale", come confermato: Mi Piace, commenti, condivisione, la sfera
di reazione con il proprio Lato Stato a schermo intero, il menu a tre puntini (Elimina/Non mi
interessa/Nascondi/Segnala). Nessun sistema di interazioni a parte da costruire e mantenere
— le stesse funzioni già esistenti, riusate qui.

**La fila in cima a Vitaeworld**: il tuo cerchietto per primo (con un "+" per aggiungerne una
nuova anche quando ne hai già una attiva), poi chi altro ha almeno una storia ancora attiva
— scompaiono da sole dopo 24 ore. Anello acceso per chi ha qualcosa che non hai ancora visto
per intero, spento per chi hai già visto tutto; stessa regola di privacy dei post, uno
"Sconosciuto" non compare nemmeno qui.

**Il visualizzatore**: avanzamento automatico (tempo fisso per foto/testo, la durata vera del
video quando c'è), tocco a sinistra/destra per tornare indietro o andare avanti — tra le
storie della stessa persona e poi tra persone diverse — tenere premuto mette in pausa. Senza
foto né video resta comunque una storia valida, mostrata come testo su un fondo sfumato nel
colore dello stato d'animo, mai una card vuota.

Due account demo (Nina e Leo) hanno già una storia attiva pronta da vedere, per provare
subito il visualizzatore — per questo sono stati resi entrambi "conosciuti" fin dalla
primissima apertura (prima lo era solo Leo, per la richiesta di Casa già seminata).

Con questo, l'intero brief originale è coperto per la prima volta davvero fino in fondo.

Build verificata da zero (`npm install` + `npm run build`) — compila ed è tipizzata
correttamente su tutte le 22 rotte.

## Checkpoint 40 — audit lungo in corso: bug reali di stato, Novità, calendario, zoom, Albero

Sessione di correzioni su una lista lunga, ancora in corso (il resto arriva nei prossimi
checkpoint). Quanto segue è già stato verificato con `tsc --noEmit` e `npm run build` puliti
dopo ogni pezzo, non solo alla fine.

**Il bug più importante trovato in questa sessione — una race condition reale**: in
`household-context.tsx`, `addPerson`/`updatePerson`/`removePerson` calcolavano il nuovo
array leggendo `people` così com'era al render in corso, non lo stato più aggiornato. Quando
due di queste scritture partivano nello stesso gestore di evento — esattamente il caso di
"Esiste, Ma Non È Chi È" (crea una persona, poi aggiorna subito il genitore che la
referenzia) o l'assegnazione di più figli insieme in "Figli" — la seconda sovrascriveva la
prima in silenzio, perdendo la persona appena creata o il legame appena scritto. Corretto
convertendo tutto alla forma funzionale di `setState`; stessa correzione applicata anche a
`health-context.tsx` per coerenza. Lo stesso pattern esiste ancora, non ancora corretto, in
`finance-context`, `mood-context`, `needs-context`, `places-context`, `tasks-context`,
`vitaecom-chat-context`, `vitaecom-social-context` — un rischio latente reale, da sistemare
in un prossimo giro.

**"Cambio Di Sesso" che non si propaga ovunque — causa trovata**: `kind` (deciso una volta
sola alla creazione) e `gender` (il campo "Sesso" delle Scoperte, modificabile sempre) sono
due dati diversi per la stessa cosa. Le etichette dell'Albero leggono sempre `gender` (si
aggiornano da sole); "Sconosciuto/a" e "Defunto/a" leggevano invece `kind`, che restava
quello di sempre. Ora cambiare "Sesso" nelle Scoperte allinea anche `kind` nella stessa
scrittura (mai per gli animali, dove non ha senso) — vedi `kindForGenderChange` in
`lib/types.ts`.

**"Deceased - False" nelle Novità**: `deceased` (un campo di `Person`, non di
`PersonalDetails`) finiva nel ramo generico di `describeDiscoveries`, che non lo riconosceva
e stampava il nome tecnico del campo. Genera una riga solo quando il decesso viene impostato
("È Deceduto"/"È Deceduta" secondo il sesso), mai quando lo si toglie o cambia solo la data.

**Pesate e attività, ora modificabili**: mancavano `updateWorkout`/`updateWeightEntry` — non
un bug di per sé, semplicemente non erano mai state scritte. Aggiunta una vera modalità di
modifica in `WorkoutDetail.tsx` e una cronologia toccabile delle pesate in `salute/page.tsx`.

**Ricorrenza task → calendario di sistema**: l'export `.ics` creava sempre un evento singolo,
mai davvero ricorrente. Ora genera un vero `RRULE` in base al tipo di ricorrenza — corretto
anche un bug collegato, la ricorrenza "Personalizzato" non veniva rispettata nemmeno dentro
l'app (ignorava i giorni scelti). **Eliminare una task** ora prova anche ad annullare
l'evento nel calendario di sistema (stesso UID, `METHOD:CANCEL`) — nessuna web app può
davvero cancellare da remoto un evento già copiato altrove, stesso limite di piattaforma già
documentato per notifiche e geolocalizzazione: alcune app di calendario (Google, Outlook,
gran parte di quelle Android) riconoscono l'annullamento da sole, Calendario di iOS
potrebbe non farlo.

**Zoom bloccato per davvero**: due cause reali, non una. La regola CSS lasciava lo zoom
nativo attivo su ogni `<img>` dell'app (pensata solo per la mappa, applicata per errore
ovunque) — tolta, resta solo sulla mappa. Gli input senza una dimensione di testo esplicita
finivano sotto i 16px su iOS Safari, che quindi zoomava la pagina da solo all'apertura
tastiera e restava zoomata finché non si chiudeva e riapriva l'app — forzato
`font-size: 16px` su tutti i campi.

**Albero Genealogico, riorganizzato su richiesta esplicita**:
- Eliminato il concetto di Patrigno/Matrigna: chi ha sposato un genitore resta "Madre"/
  "Padre" come chiunque altro, e finisce da solo nella categoria "Genitori" — la sezione
  "Patrigno E Matrigna" non esiste più.
- "Famiglia Di Provenienza" ora contiene SOLO genitori e fratelli/sorelle, come richiesto.
  Tutto il resto del sangue (nonni, prozii, zii, cugini, nipoti di un fratello/sorella) vive
  nel nuovo ramo "Famiglia Estesa"; ogni legame nato da un matrimonio (suoceri, cognati in
  entrambe le direzioni, generi/nuore, figliastri, e i ponti generici senza una parola
  propria) vive in "Famiglia Acquisita" — i cognati, in particolare, non compaiono più nella
  Famiglia Di Provenienza.
- Eliminata "Altri Legami": l'ultima categoria di sicurezza si chiama ora "Legami Acquisiti"
  ed è sempre un vero nome, mai un'etichetta vuota.
- "Fratello"/"Sorella", "Zio"/"Zia" (e "Prozio"/"Prozia", collegata), "Madre"/"Padre",
  "Nonno"/"Nonna" non ammettono più una terza forma ibrida ("Fratello/Sorella" eccetera):
  sempre una delle due parole vere, in base al sesso — il maschile resta il non marcato
  della lingua quando il sesso non è noto o non binario, non un'etichetta di comodo.
  Verificato con un piccolo albero di prova, non solo dichiarato.
- L'Albero di una singola persona non mostra più "Parente Alla Lontana": un legame
  raggiungibile solo dal grafo, senza alcun grado nominabile, restava solo rumore.
- Corretti anche alcuni residui di Title Case rimasti da prima in questo stesso file
  (i titoli dei rami, "Coniuge Di Marco" e simili ponti generici, il grado dei cugini).

**Ancora da fare**, nell'ordine in cui arriveranno: pulsante profilo unificato (wizard +
impostazioni, modalità vivo/dialogo, frase azione singola), ricerca chat e pulsante "+",
menu avatar in chat (trova nella chat / media inviati / link inviati), calorie analitiche
per attività basate sul peso, le nuove schede Alimentazione/Diario/Hobby/Wishlist (le prime
due da valutare insieme prima di costruirle), i bug di reazioni/Lato Stato/animazione
liquida del profilo altrui.

## Sviluppo in locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000

## Pubblicazione su Vercel

1. Crea un repository su GitHub e caricaci questo progetto (`git init`, `git add .`,
   `git commit -m "Prima versione: fondamenta + wizard"`, poi collega il repository remoto e fai `git push`).
2. Vai su https://vercel.com, scegli "Add New Project" e importa il repository.
   Vercel riconosce automaticamente Next.js: non serve configurare nulla.
3. Premi "Deploy". In circa un minuto avrai un URL pubblico (tipo `vitae.vercel.app`).
4. Da telefono, apri quell'URL in Safari (iOS) o Chrome (Android) e scegli
   "Aggiungi a Home" per installarla come app.

Ogni volta che invii nuovi commit al repository, Vercel ripubblica automaticamente.
