/**
 * Il bordo "sfilacciato" della malattia (avatar, card personale) non è un bordo disegnato a
 * mano — è una vera distorsione: rumore frattale (feTurbulence) che sposta i pixel del
 * contorno (feDisplacementMap), la stessa tecnica con cui si simula la carta strappata.
 * Definito una volta sola qui, riferito ovunque con `filter: url(#fray-edge)` — mai
 * applicato al contenuto (foto, testo), solo a un anello decorativo separato, altrimenti
 * distorcerebbe anche quello che c'è dentro.
 */
export function IllnessFilterDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="fray-edge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
