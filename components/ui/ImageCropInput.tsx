"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { Area, MediaSize } from "react-easy-crop";
import { Check, X, RectangleHorizontal, RectangleVertical, Square, Maximize } from "lucide-react";
import { Button } from "./Button";
import { getCroppedImage } from "@/lib/crop-image";
import { putImage } from "@/lib/image-store";

/** Le opzioni di rapporto proposte quando `allowFreeAspect` è attivo — "Originale" è
 * calcolato al volo dalle dimensioni reali dell'immagine caricata (vedi onMediaLoaded), non
 * un valore fisso, perché il rapporto di una foto scattata col telefono cambia da scatto a
 * scatto. Le altre tre coprono i casi comuni senza dover reinventare un rapporto ogni volta. */
type AspectChoice = "square" | "portrait" | "landscape" | "original";
const ASPECT_VALUES: Record<Exclude<AspectChoice, "original">, number> = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
};

/**
 * Selettore di immagini con ritaglio/centratura del soggetto — condiviso da
 * ogni punto dell'app dove si carica un'immagine (non solo l'avatar utente),
 * come richiesto: "Quando si applica un'immagine a qualcosa, questa può
 * essere ridimensionata per centrare il soggetto."
 *
 * Di serie il ritaglio resta quadrato (`aspect={1}`), come sempre — invariato per avatar e
 * per ogni chiamante esistente. Con `allowFreeAspect`, chi carica una foto può invece
 * scegliere anche un rapporto verticale, orizzontale, o il rapporto originale dello scatto:
 * pensato per punti come la galleria di un luogo, dove forzare ogni foto in un quadrato
 * tagliava sistematicamente una foto scattata in verticale col telefono.
 */
export function ImageCropInput({
  onChange,
  shape = "square",
  allowFreeAspect = false,
  trigger,
}: {
  onChange: (dataUrl: string) => void;
  shape?: "round" | "square";
  /** Se true, mostra i pulsanti di scelta rapporto (Quadrato/Verticale/Orizzontale/Originale)
   * sopra lo zoom, invece del solo ritaglio quadrato fisso. */
  allowFreeAspect?: boolean;
  trigger: (openPicker: () => void) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectChoice, setAspectChoice] = useState<AspectChoice>("square");
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const aspect = allowFreeAspect && aspectChoice === "original" ? naturalAspect : ASPECT_VALUES[aspectChoice === "original" ? "square" : aspectChoice];

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);
  const onMediaLoaded = useCallback((size: MediaSize) => {
    if (size.naturalHeight > 0) setNaturalAspect(size.naturalWidth / size.naturalHeight);
  }, []);

  // La pagina sotto non deve poter scrollare finché la finestra di ridimensionamento è
  // aperta — altrimenti si sposta rispetto allo schermo e bisogna scrollare per raggiungerla.
  // Resta fissa finché non si conferma o annulla.
  useEffect(() => {
    if (!rawImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rawImage]);

  const reset = () => {
    setRawImage(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setAspectChoice("square");
    setError(null);
  };

  const confirm = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const result = await getCroppedImage(rawImage, croppedAreaPixels);
      const key = await putImage(result);
      onChange(key);
      reset();
    } catch {
      // putImage può fallire (IndexedDB non disponibile, es. Safari in modalità privata, o
      // storage esaurito) — prima l'eccezione risaliva non gestita e la modale restava
      // bloccata senza che l'utente capisse perché "Conferma" non facesse nulla.
      setError("Non sono riuscito a salvare l'immagine. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const ASPECT_OPTIONS: { id: AspectChoice; label: string; icon: typeof Square }[] = [
    { id: "square", label: "Quadrato", icon: Square },
    { id: "portrait", label: "Verticale", icon: RectangleVertical },
    { id: "landscape", label: "Orizzontale", icon: RectangleHorizontal },
    { id: "original", label: "Originale", icon: Maximize },
  ];

  return (
    <>
      {trigger(() => inputRef.current?.click())}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {rawImage &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-void-950/90 p-6 backdrop-blur-md">
          <div className="glass-strong w-full max-w-sm rounded-xl3 p-5">
            {allowFreeAspect && (
              <div className="mb-3 flex gap-1.5">
                {ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAspectChoice(opt.id)}
                    className={`focus-ring flex flex-1 flex-col items-center gap-1 rounded-xl2 border px-2 py-2 text-[10px] transition ${
                      aspectChoice === opt.id
                        ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100"
                        : "border-white/10 text-ink-600 hover:border-white/25"
                    }`}
                  >
                    <opt.icon size={15} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <div className="relative h-72 w-full overflow-hidden rounded-xl2 bg-black">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={shape === "round" ? "round" : "rect"}
                showGrid={shape === "square"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-4 w-full accent-[#7C5CFF]"
              aria-label="Zoom immagine"
            />
            {error && <p className="mt-3 text-xs text-aura-pink">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset} disabled={saving}>
                <X size={16} /> Annulla
              </Button>
              <Button size="sm" onClick={confirm} disabled={saving}>
                <Check size={16} /> {saving ? "Salvo..." : "Conferma"}
              </Button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
