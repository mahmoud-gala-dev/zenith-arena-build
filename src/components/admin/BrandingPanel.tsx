import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowLeftRight, RotateCcw, Gauge } from "lucide-react";

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

/** Live preview of the header logo aura, driven by current (unsaved) motion values. */
function LogoMotionPreview({
  cfg,
  logoUrl,
  reducedMotionSafe,
  respectSystem,
}: {
  cfg: LogoMotionConfig;
  logoUrl: string;
  reducedMotionSafe: boolean;
  respectSystem: boolean;
}) {
  const systemReduce = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const suppress = reducedMotionSafe && respectSystem && systemReduce;
  const on = cfg.enabled && !suppress;
  const intensity = Math.max(0, Math.min(100, cfg.intensity)) / 100;
  const speedFactor = 0.5 + (100 - Math.max(0, Math.min(100, cfg.speed))) / 50;
  const outerBlur = 12 + Math.round(6 * intensity);
  const innerBlur = 6 + Math.round(4 * intensity);
  const auraOpacity = 0.35 + 0.45 * intensity;

  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-b from-black/60 to-black/30">
      <div className="relative inline-flex items-center justify-center">
        {on && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[-40%] rounded-full"
            style={{
              opacity: auraOpacity,
              background:
                "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--gold) 85%, transparent) 60deg, transparent 140deg, color-mix(in oklab, var(--gold) 55%, transparent) 220deg, transparent 320deg)",
              filter: `blur(${outerBlur}px)`,
              animation: `spin ${14 * speedFactor}s linear infinite`,
            }}
          />
        )}
        {on && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[-15%] rounded-full"
            style={{
              opacity: 0.35 + 0.35 * intensity,
              background:
                "conic-gradient(from 180deg, transparent 0deg, color-mix(in oklab, var(--gold) 65%, white) 90deg, transparent 200deg, color-mix(in oklab, var(--primary) 55%, transparent) 280deg, transparent 360deg)",
              filter: `blur(${innerBlur}px)`,
              animation: `spin-reverse ${22 * speedFactor}s linear infinite`,
            }}
          />
        )}
        {logoUrl ? (
          <img src={logoUrl} alt="preview" className="relative h-16 w-auto object-contain" />
        ) : (
          <span className="relative text-sm font-bold text-white/80">LOGO</span>
        )}
      </div>
      {suppress && (
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
          Suppressed (prefers-reduced-motion)
        </span>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}

function MotionControls({
  lang,
  value,
  onChange,
  onReset,
  onCopyFromOther,
  logoUrl,
  reducedMotionSafe,
  respectSystem,
}: {
  lang: "en" | "ar";
  value: LogoMotionConfig;
  onChange: (v: LogoMotionConfig) => void;
  onReset: () => void;
  onCopyFromOther: () => void;
  logoUrl: string;
  reducedMotionSafe: boolean;
  respectSystem: boolean;
}) {
  const label = lang === "en" ? "English" : "العربية";
  const otherLabel = lang === "en" ? "Arabic" : "English";
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">Toggle & tune the header logo motion.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>
      <LogoMotionPreview
        cfg={value}
        logoUrl={logoUrl}
        reducedMotionSafe={reducedMotionSafe}
        respectSystem={respectSystem}
      />
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
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCopyFromOther}>
          <ArrowLeftRight className="mr-1 h-3.5 w-3.5" />
          Copy from {otherLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

/** Measures average FPS over several samples and shows before/after deltas. */
function PerfTester({
  onSuggestion,
}: {
  onSuggestion: (intensity: number, speed: number, fps: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [suggested, setSuggested] = useState<{ intensity: number; speed: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const measureOnce = () =>
    new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = (now: number) => {
        frames++;
        if (now - start < 700) requestAnimationFrame(tick);
        else resolve(Math.round((frames * 1000) / (now - start)));
      };
      requestAnimationFrame(tick);
    });

  const run = async () => {
    if (!boxRef.current) return;
    setRunning(true);
    setFps(null);
    setSuggested(null);
    const el = boxRef.current;
    el.style.animation = "spin 2s linear infinite";
    const samples: number[] = [];
    for (let i = 0; i < 4; i++) samples.push(await measureOnce());
    el.style.animation = "";
    samples.sort((a, b) => a - b);
    const trimmed = samples.slice(1, -1); // drop outliers
    const avg = Math.round(trimmed.reduce((s, n) => s + n, 0) / trimmed.length);
    // Recommend intensity + speed together for smoother result on this device.
    const rec =
      avg >= 58 ? { intensity: 85, speed: 65 }
      : avg >= 45 ? { intensity: 65, speed: 55 }
      : avg >= 28 ? { intensity: 40, speed: 40 }
      : { intensity: 15, speed: 25 };
    setFps(avg);
    setSuggested(rec);
    if (baseline == null) setBaseline(avg); else setAfter(avg);
    onSuggestion(rec.intensity, rec.speed, avg);
    setRunning(false);
  };

  const badge = fps == null
    ? "—"
    : fps >= 55 ? "Excellent" : fps >= 40 ? "Good" : fps >= 25 ? "Fair" : "Low";
  const delta = baseline != null && after != null ? after - baseline : null;

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4" /> Performance test
          </p>
          <p className="text-xs text-muted-foreground">
            Averages 4 samples of a blur + rotation stress. Re-run after tuning to compare FPS.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={run} disabled={running}>
            {running ? "Testing…" : baseline == null ? "Run baseline" : "Re-run"}
          </Button>
          {baseline != null && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setBaseline(null); setAfter(null); setFps(null); setSuggested(null); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded bg-muted/40 p-2">
          <div className="text-muted-foreground">Baseline</div>
          <div className="text-base font-semibold">{baseline ?? "—"}</div>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <div className="text-muted-foreground">After</div>
          <div className="text-base font-semibold">{after ?? "—"}</div>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <div className="text-muted-foreground">Δ FPS</div>
          <div className={"text-base font-semibold " + (delta == null ? "" : delta >= 0 ? "text-emerald-500" : "text-red-500")}>
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          </div>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <div className="text-muted-foreground">Rating</div>
          <div className="text-base font-semibold">{badge}</div>
        </div>
      </div>
      {suggested && (
        <div className="rounded bg-muted/20 p-2 text-xs text-muted-foreground">
          Suggested: intensity <b>{suggested.intensity}%</b> · speed <b>{suggested.speed}%</b> — applied to both languages.
        </div>
      )}
      <div
        ref={boxRef}
        aria-hidden
        className="pointer-events-none absolute h-24 w-24 -z-10 opacity-0"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(201,168,76,0.9) 60deg, transparent 140deg, rgba(201,168,76,0.6) 220deg, transparent 320deg)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}

/** Export / import logo_motion settings as JSON. */
function ExportImportPanel({
  motionEn,
  motionAr,
  reducedMotionSafe,
  onImport,
}: {
  motionEn: LogoMotionConfig;
  motionAr: LogoMotionConfig;
  reducedMotionSafe: boolean;
  onImport: (en: LogoMotionConfig, ar: LogoMotionConfig, rms: boolean) => void;
}) {
  const [text, setText] = useState("");
  const payload = useMemo(
    () => JSON.stringify({ en: motionEn, ar: motionAr, reduced_motion_safe: reducedMotionSafe }, null, 2),
    [motionEn, motionAr, reducedMotionSafe],
  );

  const copy = async () => {
    try { await navigator.clipboard.writeText(payload); toast.success("Copied JSON to clipboard"); }
    catch { toast.error("Copy failed"); }
  };

  const doImport = () => {
    try {
      const parsed = JSON.parse(text);
      const norm = (m: Partial<LogoMotionConfig> | undefined): LogoMotionConfig => ({
        ...DEFAULT_LOGO_MOTION,
        ...(m ?? {}),
      });
      onImport(norm(parsed.en), norm(parsed.ar), Boolean(parsed.reduced_motion_safe ?? true));
      toast.success("Imported settings — preview updated");
      setText("");
    } catch {
      toast.error("Invalid JSON");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-semibold">Export / Import (JSON)</p>
        <p className="text-xs text-muted-foreground">Move logo motion presets between languages or environments.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Current settings</Label>
          <textarea
            readOnly
            value={payload}
            className="h-40 w-full rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px]"
          />
          <Button type="button" size="sm" variant="outline" onClick={copy}>Copy JSON</Button>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Paste to import</Label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{"en":{...},"ar":{...},"reduced_motion_safe":true}'
            className="h-40 w-full rounded-md border border-border bg-background p-2 font-mono text-[11px]"
          />
          <Button type="button" size="sm" variant="outline" onClick={doImport} disabled={!text.trim()}>
            Import JSON
          </Button>
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
  const [reducedMotionSafe, setReducedMotionSafe] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setLight(data.logo_light_url);
      setDark(data.logo_dark_url);
      setMotionEn(data.logo_motion.en);
      setMotionAr(data.logo_motion.ar);
      setReducedMotionSafe(data.logo_motion.reduced_motion_safe ?? true);
    }
  }, [data]);

  // Live preview: push current in-panel values into the branding query cache
  // so any <Header /> mounted on the page reflects changes instantly (without saving).
  const [livePreview, setLivePreview] = useState(true);
  useEffect(() => {
    if (!data || !livePreview) return;
    qc.setQueryData(["settings", "branding"], {
      ...data,
      logo_light_url: light,
      logo_dark_url: dark,
      logo_motion: { en: motionEn, ar: motionAr, reduced_motion_safe: reducedMotionSafe },
    });
  }, [data, livePreview, qc, light, dark, motionEn, motionAr, reducedMotionSafe]);

  // On unmount, invalidate so cache re-syncs with DB (drops unsaved preview).
  useEffect(() => () => { qc.invalidateQueries({ queryKey: ["settings", "branding"] }); }, [qc]);

  const systemReduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const applySuggested = (intensity: number, speed: number) => {
    setMotionEn((m) => ({ ...m, intensity, speed }));
    setMotionAr((m) => ({ ...m, intensity, speed }));
    toast.success(`Applied suggested intensity ${intensity}% / speed ${speed}% to both languages`);
  };


  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({
          value: {
            logo_light_url: light,
            logo_dark_url: dark,
            logo_motion: {
              en: motionEn,
              ar: motionAr,
              reduced_motion_safe: reducedMotionSafe,
            },
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Logo motion</h3>
                  <p className="text-xs text-muted-foreground">
                    Live preview updates instantly. Configure independently per language.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMotionEn(DEFAULT_LOGO_MOTION);
                    setMotionAr(DEFAULT_LOGO_MOTION);
                    setReducedMotionSafe(true);
                    toast.success("Reset all motion settings to brand defaults");
                  }}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset all to brand defaults
                </Button>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Respect system reduced-motion</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, users with <code>prefers-reduced-motion</code> see the logo without rotation or spark.
                    {systemReduce ? " Your OS currently requests reduced motion." : ""}
                  </p>
                </div>
                <Switch checked={reducedMotionSafe} onCheckedChange={setReducedMotionSafe} />
              </div>

              <PerfTester onSuggestion={applySuggested} />

              <div className="grid gap-4 md:grid-cols-2">
                <MotionControls
                  lang="en"
                  value={motionEn}
                  onChange={setMotionEn}
                  onReset={() => setMotionEn(DEFAULT_LOGO_MOTION)}
                  onCopyFromOther={() => setMotionEn(motionAr)}
                  logoUrl={light}
                  reducedMotionSafe={reducedMotionSafe}
                  respectSystem={true}
                />
                <MotionControls
                  lang="ar"
                  value={motionAr}
                  onChange={setMotionAr}
                  onReset={() => setMotionAr(DEFAULT_LOGO_MOTION)}
                  onCopyFromOther={() => setMotionAr(motionEn)}
                  logoUrl={light}
                  reducedMotionSafe={reducedMotionSafe}
                  respectSystem={true}
                />
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
