import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { aiGenerateContent } from "@/lib/ai/ai.functions";
import { useCan } from "@/lib/rbac";

type Kind =
  | "blog_post"
  | "service_description"
  | "project_story"
  | "product_description"
  | "generic"
  | "faq";

type Props = {
  triggerLabel?: string;
  defaultKind?: Kind;
  defaultLanguage?: "en" | "ar";
  onInsert: (text: string) => void;
  targetTable?: string;
  targetId?: string;
};

export function AIContentDialog({
  triggerLabel = "AI · Generate",
  defaultKind = "generic",
  defaultLanguage = "en",
  onInsert,
  targetTable,
  targetId,
}: Props) {
  const { can } = useCan("content.ai.run");
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [language, setLanguage] = useState<"en" | "ar">(defaultLanguage);
  const [maxWords, setMaxWords] = useState(400);
  const [advanced, setAdvanced] = useState(false);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const generateFn = useServerFn(aiGenerateContent);

  if (!can) return null;

  async function run() {
    if (!brief.trim()) {
      toast.error("Enter a brief first");
      return;
    }
    setBusy(true);
    try {
      const res = await generateFn({
        data: { brief, language, kind, maxWords, advanced, targetTable, targetId },
      });
      setResult(res.text);
      toast.success(`Generated with ${res.model}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  function insertAndClose() {
    if (!result) return;
    onInsert(result);
    setOpen(false);
    setResult("");
    setBrief("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Content Assistant
          </DialogTitle>
          <DialogDescription>
            Write a short brief; AI drafts full content. Review & edit before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic</SelectItem>
                  <SelectItem value="blog_post">Blog post</SelectItem>
                  <SelectItem value="service_description">Service description</SelectItem>
                  <SelectItem value="project_story">Project story</SelectItem>
                  <SelectItem value="product_description">Product description</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max words</Label>
              <Input
                type="number"
                min={20}
                max={2000}
                value={maxWords}
                onChange={(e) => setMaxWords(Number(e.target.value) || 400)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Brief</Label>
            <Textarea
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the topic, key points, target audience, tone…"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="ai-adv" checked={advanced} onCheckedChange={setAdvanced} />
            <Label htmlFor="ai-adv" className="text-xs">Use advanced model (slower, higher quality)</Label>
          </div>

          {result && (
            <div>
              <Label className="text-xs">Draft</Label>
              <Textarea
                rows={10}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                dir={language === "ar" ? "rtl" : "ltr"}
                className="font-mono text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {result ? "Regenerate" : "Generate"}
          </Button>
          <Button type="button" onClick={insertAndClose} disabled={!result}>
            Insert into field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
