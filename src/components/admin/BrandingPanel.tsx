import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBranding, DEFAULT_LOGO_MOTION, type LogoMotionConfig } from "@/hooks/useBranding";
import { useQueryClient } from "@tanstack/react-query";

function LogoField({
  label,
  surface,
  value,
  onChange,
}: {
  label: string;
  surface: "light" | "dark";
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!/\.(svg|png|jpe?g|webp)$/i.test(file.name)) {
      toast.error("Only SVG, PNG, JPG or WebP files are allowed");
      return;
    }
    setUploading(true);
    try {
      const path = `logos/${surface}-${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // media bucket is private → generate a 10 year signed URL
      const { data: signed, error: sErr } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Could not create URL");
      onChange(signed.signedUrl);
      toast.success("Uploaded");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={
          "rounded-lg border border-border p-4 " +
          (surface === "dark" ? "bg-ink text-ink-foreground" : "bg-background")
        }
      >
        <div className="flex h-20 items-center justify-center">
          {value ? (
            <img src={value} alt={label} className="max-h-16 w-auto object-contain" />
          ) : (
            <span className="text-xs opacity-60">No logo set — default will be used</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="url"
          placeholder="https://... (SVG or PNG)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="relative">
          <input
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={uploading}
          />
          <Button type="button" variant="outline" disabled={uploading} className="w-full sm:w-auto">
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function MotionControls({
  lang,
  value,
  onChange,
}: {
  lang: "en" | "ar";
  value: LogoMotionConfig;
  onChange: (v: LogoMotionConfig) => void;
}) {
  const label = lang === "en" ? "English" : "العربية";
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">Toggle & tune the header logo motion.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>
      <div className={value.enabled ? "space-y-4" : "space-y-4 opacity-50 pointer-events-none"}>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>Intensity</Label>
            <span className="text-muted-foreground">{value.intensity}%</span>
          </div>
          <Slider
            value={[value.intensity]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => onChange({ ...value, intensity: v })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>Speed</Label>
            <span className="text-muted-foreground">{value.speed}%</span>
          </div>
          <Slider
            value={[value.speed]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => onChange({ ...value, speed: v })}
          />
        </div>
      </div>
    </div>
  );
}

export function BrandingPanel() {
  const { data, isLoading } = useBranding();
  const qc = useQueryClient();
  const [light, setLight] = useState("");
  const [dark, setDark] = useState("");
  const [motionEn, setMotionEn] = useState<LogoMotionConfig>(DEFAULT_LOGO_MOTION);
  const [motionAr, setMotionAr] = useState<LogoMotionConfig>(DEFAULT_LOGO_MOTION);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setLight(data.logo_light_url);
      setDark(data.logo_dark_url);
      setMotionEn(data.logo_motion.en);
      setMotionAr(data.logo_motion.ar);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({
          value: {
            logo_light_url: light,
            logo_dark_url: dark,
            logo_motion: { en: motionEn, ar: motionAr },
          },
          is_public: true,
        })
        .eq("key", "branding");
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["settings", "branding"] });
      toast.success("Branding saved");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header logos & motion</CardTitle>
        <CardDescription>
          Upload two separate logos (light/dark) and control the header logo animation intensity and speed per language.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <LogoField label="Light theme logo" surface="light" value={light} onChange={setLight} />
              <LogoField label="Dark theme logo" surface="dark" value={dark} onChange={setDark} />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Logo motion</h3>
                <p className="text-xs text-muted-foreground">
                  Configure the animated aura independently for each language.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MotionControls lang="en" value={motionEn} onChange={setMotionEn} />
                <MotionControls lang="ar" value={motionAr} onChange={setMotionAr} />
              </div>
            </div>
          </>
        )}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} variant="hero">
            {saving ? "Saving…" : "Save branding"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
