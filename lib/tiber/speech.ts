/**
 * Voce di Tiber — sintesi vocale (lettura ad alta voce delle sue risposte) e il piccolo
 * segnale sonoro che accompagna un'intromissione spontanea sulla bolla flottante. Nessuna
 * chiamata qui dentro parte mai da sola: ogni funzione è invocata solo da chi già sa che
 * l'interruttore "Tiber ti parla" è acceso (vedi voiceEnabled in settings-context.tsx) — è il
 * chiamante a non richiamarle affatto quando è spento, non queste funzioni a restare mute al
 * proprio interno. Questo è anche il motivo per cui, a interruttore spento, non viene mai
 * chiesto il permesso del microfono né avviata la sintesi vocale: il codice che lo farebbe non
 * viene proprio eseguito, non solo silenziato.
 *
 * Usa le API native del browser (SpeechSynthesis, Web Audio), non Gemini: le risposte restano
 * testo, è il dispositivo a leggerle — scelta già presa in precedenza, coerente con l'audio
 * dell'UTENTE che invece va crudo a Gemini (vedi userAudioTurn in gemini.ts), due direzioni
 * diverse per due motivi diversi.
 */

const LANG = "it-IT";

function hasSpeechSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Legge ad alta voce un messaggio di Tiber. Non annulla mai una lettura già in corso (a
 * differenza di un normale "interrompi e ricomincia"): più messaggi ravvicinati nello stesso
 * turno (es. un commento seguito dall'esito di un tool) si accodano naturalmente nella coda di
 * SpeechSynthesis e vengono letti in sequenza, invece che il primo tagliato di netto dal
 * secondo — per interrompere davvero una lettura in corso c'è `stopSpeaking`, usata solo dal
 * pulsante "termina conversazione".
 *
 * Chiamata SOLO per messaggi role="assistant" non proattivi (le risposte dirette in chat, sia
 * a testo che a voce) o per un'intromissione spontanea dopo che l'utente l'ha accettata dal
 * popup sulla bolla — mai per un messaggio role="user": il controllo va fatto da chi chiama,
 * guardando il ruolo del messaggio (mai "l'ultimo arrivato", che potrebbe benissimo essere
 * l'utente) — qui dentro non c'è alcun controllo di ruolo perché questa funzione riceve solo
 * il testo, non l'intero messaggio.
 */
export function speakTiberMessage(text: string): void {
  if (!hasSpeechSynthesis() || !text.trim()) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;
    window.speechSynthesis.speak(utterance);
  } catch {
    // sintesi vocale non disponibile o fallita: il testo resta comunque visibile in chat, non
    // è un errore da mostrare all'utente né da far fallire l'invio del messaggio.
  }
}

/** Interrompe subito qualunque lettura in corso o in coda — usata dal pulsante "termina
 * conversazione" sulla bolla flottante, l'unico punto in cui tagliare Tiber a metà frase è
 * un'azione voluta dall'utente invece che un effetto collaterale imprevisto. */
export function stopSpeaking(): void {
  if (!hasSpeechSynthesis()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignorato
  }
}

/**
 * Limite noto e onesto di Safari/iOS (non un bug dell'app): SpeechSynthesis.speak() funziona
 * in modo affidabile solo se chiamato in modo sincrono dentro un gesto dell'utente (un tocco).
 * Il primo scambio vocale lo rispetta sempre (parte dal tocco della spunta o dal rilascio del
 * microfono). Ma la lettura della risposta SUCCESSIVA parte solo dopo aver aspettato Gemini in
 * modo asincrono — un'attesa che, su iPhone, a volte basta a far perdere il collegamento con
 * quel gesto, e la lettura automatica esce muta pur non generando alcun errore visibile.
 *
 * Correttivo a tentativo, non garanzia: richiamato nello STESSO gestore dell'evento che
 * rilascia il microfono (mai dentro una funzione async già in corso), prima di aspettare
 * Gemini — un'utterance quasi impercettibile (volume quasi a zero, un solo spazio) che serve
 * solo a "tenere caldo" il motore vocale mentre il gesto vero è ancora fresco. Non risolve il
 * problema per costruzione documentata da Apple, solo per osservazione pratica diffusa — va
 * verificato su un iPhone reale, come già detto onestamente prima di scrivere questo file.
 */
export function primeSpeechEngine(): void {
  if (!hasSpeechSynthesis()) return;
  try {
    const warmup = new SpeechSynthesisUtterance(" ");
    warmup.volume = 0.01;
    warmup.lang = LANG;
    window.speechSynthesis.speak(warmup);
  } catch {
    // nel peggiore dei casi si perde solo il tentativo di correttivo, non il messaggio vero
  }
}

/**
 * Il "suono" che accompagna l'arrivo di un'intromissione spontanea (punto 2 del progetto) —
 * distinto apposta dalla lettura vera del messaggio, che parte solo dopo la spunta. Generato
 * con Web Audio invece di un file .mp3/.wav in public/: nessun asset da scaricare, caricare o
 * poter mancare, e un unico oscillatore basta per un breve segnale in due toni, percepibile
 * ma non invadente. Richiede comunque un contesto audio "sbloccato" da un gesto utente per
 * suonare in modo affidabile su iOS — stesso limite di primeSpeechEngine sopra, ma qui
 * l'occasione è diversa: l'intromissione arriva quando vuole lei, non da un tocco, quindi il
 * suono potrebbe non sentirsi la primissima volta in assoluto su iPhone finché l'utente non ha
 * interagito almeno una volta con la pagina — il messaggio scritto sulla bolla resta comunque
 * visibile a prescindere.
 */
export function playProactiveChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.015);
      gain.gain.linearRampToValueAtTime(0, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };

    playTone(880, 0, 0.11);
    playTone(1320, 0.1, 0.14);

    // Chiude il contesto poco dopo l'ultimo tono — un AudioContext lasciato aperto
    // indefinitamente resta comunque un handle attivo, inutile una volta suonato il segnale.
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Web Audio non disponibile: il popup resta comunque visibile, solo senza suono
  }
}
