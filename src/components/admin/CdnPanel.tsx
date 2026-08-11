import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Cloud, Loader2, Save, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getCdnConfig, saveCdnConfig, testCdnUrl, type CdnConfig, type CdnProvider,
} from "@/lib/integrations/cdn.functions";

const PROVIDERS: Array<{ value: CdnProvider; label: string; hint: string }> = [
  { value: "none", label: "Built-in (Lovable CDN)", hint: "الافتراضي — روابط دائمة عبر Cloudflare بدون إعداد." },
  { value: "bunny", label: "Bunny.net", hint: "مثال: https://egytic.b-cdn.net" },
  { value: "cloudflare", label: "Cloudflare (custom domain / R2)", hint: "مثال: https://cdn.egytic.com" },
  { value: "cloudinary", label: "Cloudinary", hint: "مثال: https://res.cloudinary.com/<cloud>/image/fetch" },
  { value: "imgix", label: "imgix", hint: "مثال: https://egytic.imgix.net" },
  { value: "custom", label: "Custom origin", hint: "أي دومين CDN يوجّه إلى الموقع." },
];

export function CdnPanel() {
  const qc = useQueryClient();
  const get = useServerFn(getCdnConfig);
  const save = useServerFn(saveCdnConfig);
  const test = useServerFn(testCdnUrl);

  const { data, isLoading } = useQuery({ queryKey: ["integrations", "cdn"], queryFn: () => get() });
  const [cfg, setCfg] = useState<CdnConfig>({
    provider: "none", base_url: "", enabled: false, transform_query: "", test_path: "",
  });
  useEffect(() => { if (data) setCfg(data); }, [data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: cfg }),
    onSuccess: () => { toast.success("CDN settings saved"); qc.invalidateQueries({ queryKey: ["integrations", "cdn"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof testCdnUrl>> | null>(null);
  const [origin, setOrigin] = useState<Awaited<ReturnType<typeof testCdnUrl>> | null>(null);

  function buildUrl(base: string) {
    const path = cfg.test_path.startsWith("/") ? cfg.test_path : `/${cfg.test_path}`;
    const url = `${base.replace(/\/$/, "")}${path}`;
    return cfg.transform_query ? `${url}${url.includes("?") ? "&" : "?"}${cfg.transform_query}` : url;
  }

  async function runTest() {
    if (!cfg.test_path) { toast.error("أدخل مسار صورة للاختبار"); return; }
    setTesting(true); setResult(null); setOrigin(null);
    try {
      const siteOrigin = window.location.origin;
      const [cdnRes, originRes] = await Promise.all([
        cfg.base_url ? test({ data: { url: buildUrl(cfg.base_url) } }) : Promise.resolve(null),
        test({ data: { url: buildUrl(siteOrigin) } }),
      ]);
      setResult(cdnRes);
      setOrigin(originRes);
      if (cdnRes && !cdnRes.ok) toast.error(`CDN failed · ${cdnRes.status || cdnRes.error}`);
      else if (cdnRes) toast.success(`CDN OK · ${cdnRes.status} · ${cdnRes.duration_ms}ms`);
      else toast.success(`Origin OK · ${originRes?.status} · ${originRes?.duration_ms}ms`);
    } catch (e: any) {
      toast.error(e?.message ?? "Test failed");
    } finally {
      setTesting(false);
    }
  }

  if (isLoading) return <div className="rounded-lg border p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const hint = PROVIDERS.find((p) => p.value === cfg.provider)?.hint;

  return (
    <section className="space-y-4 rounded-lg border p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Cloud className="h-5 w-5 text-primary" /> CDN خارجي (اختياري)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          الموقع يستخدم Lovable CDN افتراضيًا (روابط دائمة). يمكنك توجيه الصور عبر مزوّد خارجي واختبار
          الاتصال والسرعة قبل التفعيل.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>المزوّد</Label>
          <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v as CdnProvider })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            placeholder="https://cdn.egytic.com"
            value={cfg.base_url}
            onChange={(e) => setCfg({ ...cfg, base_url: e.target.value.trim() })}
          />
        </div>
        <div className="space-y-2">
          <Label>Transform query (اختياري)</Label>
          <Input
            placeholder="width=1600&quality=80"
            value={cfg.transform_query}
            onChange={(e) => setCfg({ ...cfg, transform_query: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>مسار صورة للاختبار</Label>
          <Input
            placeholder="/__l5e/assets-v1/<id>/photo.jpg"
            value={cfg.test_path}
            onChange={(e) => setCfg({ ...cfg, test_path: e.target.value.trim() })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <div className="font-medium">تفعيل التوجيه عبر الـCDN</div>
          <div className="text-xs text-muted-foreground">لا تفعّله إلا بعد نجاح الاختبار بحالة 200.</div>
        </div>
        <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          حفظ
        </Button>
        <Button variant="outline" onClick={runTest} disabled={testing}>
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          اختبار الاتصال والسرعة
        </Button>
      </div>

      {(result || origin) && (
        <div className="space-y-2 text-sm">
          {result && <TestRow label="CDN" r={result} />}
          {origin && <TestRow label="Origin (الموقع)" r={origin} />}
        </div>
      )}
    </section>
  );
}

function TestRow({ label, r }: { label: string; r: NonNullable<Awaited<ReturnType<typeof testCdnUrl>>> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
      {r.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
      <span className="font-medium">{label}</span>
      <Badge variant={r.ok ? "secondary" : "destructive"}>{r.status || "ERR"}</Badge>
      <span className="text-muted-foreground">{r.duration_ms} ms</span>
      {r.bytes ? <span className="text-muted-foreground">{Math.round(r.bytes / 1024)} KB</span> : null}
      {r.content_type ? <span className="text-muted-foreground">{r.content_type}</span> : null}
      {r.cache_status ? <Badge variant="outline">cache: {r.cache_status}</Badge> : null}
      {r.error ? <span className="text-destructive">{r.error}</span> : null}
    </div>
  );
}
