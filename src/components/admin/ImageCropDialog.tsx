import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { cropImage, fileToObjectUrl, type CropRect } from "@/lib/imagePipeline";

type Props = {
  file: File | null;
  aspect: number;
  onCancel: () => void;
  /** Receives cropped JPEG blob (high-quality) ready for the upload pipeline. */
  onConfirm: (blob: Blob) => void | Promise<void>;
  title?: string;
  /** Progress 0..100 reported by the parent's upload pipeline. */
  externalProgress?: { pct: number; label: string } | null;
};

export function ImageCropDialog({ file, aspect, onCancel, onConfirm, title = "Crop image", externalProgress }: Props) {
  const url = useMemo(() => (file ? fileToObjectUrl(file) : null), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<CropRect | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropPct, setCropPct] = useState(0);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixelCrop(null);
    setCropPct(0);
  }, [file]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setPixelCrop({ x: areaPixels.x, y: areaPixels.y, width: areaPixels.width, height: areaPixels.height });
  }, []);

  async function confirm() {
    if (!file || !pixelCrop) return;
    setBusy(true);
    setCropPct(15);
    try {
      const blob = await cropImage(file, pixelCrop, "image/jpeg", 0.94);
      setCropPct(35);
      await onConfirm(blob);
      setCropPct(100);
    } finally {
      setBusy(false);
    }
  }

  const combinedPct = Math.max(cropPct, externalProgress?.pct ? externalProgress.pct * 100 : 0);
  const progressLabel = externalProgress?.label || (busy ? "Cropping…" : "");

  return (
    <Dialog open={!!file} onOpenChange={(o) => { if (!o && !busy) onCancel(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="relative h-[420px] w-full overflow-hidden rounded-md bg-black/80">
          {url && (
            <Cropper
              image={url}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition
              showGrid
            />
          )}
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-14">Zoom</span>
            <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0] ?? 1)} disabled={busy} />
            <span className="w-10 text-right tabular-nums">{zoom.toFixed(2)}×</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Aspect locked to {aspect.toFixed(2)}:1. Drag to reposition.
          </p>
          {(busy || combinedPct > 0) && (
            <div className="space-y-1 pt-1">
              <Progress value={combinedPct} className="h-2" />
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {progressLabel || "Processing…"} · {Math.round(combinedPct)}%
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={confirm} disabled={busy || !pixelCrop}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crop & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
