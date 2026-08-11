import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { aiEnhanceImage } from "@/lib/ai/image.functions";

type Props = {
  /** Current image URL to enhance. */
  imageUrl: string;
  /** Receives the enhanced image as a Blob so the caller can crop/upload it. */
  onEnhanced: (blob: Blob) => void | Promise<void>;
  disabled?: boolean;
  size?: "sm" | "default";
};

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/** "Enhance with AI" — upscales/cleans the current image via the configured AI provider. */
export function AIImageEnhanceButton({ imageUrl, onEnhanced, disabled, size = "sm" }: Props) {
  const enhance = useServerFn(aiEnhanceImage);
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!imageUrl) return toast.error("Add or upload an image first.");
    setBusy(true);
    try {
      // CDN/storage paths can be relative ("/__l5e/..."), but the server needs an absolute URL.
      const absoluteUrl = new URL(imageUrl, window.location.origin).href;
      const { dataUrl } = await enhance({
        data: { imageUrl: absoluteUrl, instructions: instructions.trim() || undefined },
      });
      const blob = await dataUrlToBlob(dataUrl);
      await onEnhanced(blob);
      toast.success("Image enhanced — review the crop and save.");
      setOpen(false);
      setInstructions("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enhancement failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={disabled || !imageUrl}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        <span className="ml-1">Enhance with AI</span>
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> AI image enhancement
            </DialogTitle>
            <DialogDescription>
              Sharpens, denoises and colour-corrects the current image, then re-uploads it in the
              correct aspect ratio and responsive sizes. The scene is preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Extra instructions (optional)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. brighter evening light, cooler green tone on the turf"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={run} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {busy ? "Enhancing…" : "Enhance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
