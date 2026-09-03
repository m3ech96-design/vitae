"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { ImageCropInput } from "../ui/ImageCropInput";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { Button } from "../ui/Button";

function PhotoThumb({ photoKey, onClick }: { photoKey: string; onClick: () => void }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="aspect-square animate-pulse rounded-lg bg-white/[0.03]" />;
  return (
    <button onClick={onClick} className="focus-ring aspect-square overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

function FullPhoto({ photoKey }: { photoKey: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-full rounded-xl2 object-cover" />;
}

/** Una foto periodica, in sequenza temporale — la stessa idea del diario fotografico
 * pensato per la scheda Diario, qui applicata al percorso fisico. Ordinate dalla più
 * recente, come uno scorrimento nel tempo. */
export function ProgressPhotosSection() {
  const { progressPhotos, addProgressPhoto, removeProgressPhoto } = useHealth();
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = [...progressPhotos].sort((a, b) => b.date.localeCompare(a.date));
  const openPhoto = sorted.find((p) => p.id === openId);

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        <ImageCropInput
          shape="square"
          onChange={(dataUrl) => addProgressPhoto({ photoKey: dataUrl, date: todayIso() })}
          trigger={(openPicker) => (
            <button
              onClick={openPicker}
              className="focus-ring flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
            >
              <Camera size={16} />
              <span className="text-[9px]">Nuova foto</span>
            </button>
          )}
        />
        {sorted.map((p) => (
          <PhotoThumb key={p.id} photoKey={p.photoKey} onClick={() => setOpenId(p.id)} />
        ))}
      </div>

      {openPhoto && (
        <PersonalCardSheet title={formatDateShort(openPhoto.date)} onClose={() => setOpenId(null)}>
          <FullPhoto photoKey={openPhoto.photoKey} />
          <Button
            variant="danger"
            size="sm"
            className="mt-4 w-full justify-center"
            onClick={() => {
              removeProgressPhoto(openPhoto.id);
              setOpenId(null);
            }}
          >
            Elimina foto
          </Button>
        </PersonalCardSheet>
      )}
    </div>
  );
}
