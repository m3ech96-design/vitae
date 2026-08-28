"use client";
import { useCallback, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Check, X } from "lucide-react";
import { Button } from "./Button";
import { getCroppedImage } from "@/lib/crop-image";
import { putImage } from "@/lib/image-store";

/**
 * Selettore di immagini con ritaglio/centratura del soggetto — condiviso da
 * ogni punto dell'app dove si carica un'immagine (non solo l'avatar utente),
 * come richiesto: "Quando si applica un'immagine a qualcosa, questa può
 * essere ridimensionata per centrare il soggetto."
 */
export function ImageCropInput({
  onChange,
  shape = "square",
  trigger,
}: {
  onChange: (dataUrl: string) => void;
  shape?: "round" | "square";
  trigger: (openPicker: () => void) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

  const reset = () => {
    setRawImage(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const confirm = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    const result = await getCroppedImage(rawImage, croppedAreaPixels);
    const key = await putImage(result);
    onChange(key);
    reset();
  };

  return (
    <>
      {trigger(() => inputRef.current?.click())}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {rawImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-void-950/90 p-6 backdrop-blur-md">
          <div className="glass-strong w-full max-w-sm rounded-xl3 p-5">
            <div className="relative h-72 w-full overflow-hidden rounded-xl2 bg-black">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={shape === "round" ? "round" : "rect"}
                showGrid={shape === "square"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
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
              aria-label="Zoom Immagine"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X size={16} /> Annulla
              </Button>
              <Button size="sm" onClick={confirm}>
                <Check size={16} /> Conferma
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
