import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2, Send, Save, Webhook, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getN8nConfig, saveN8nConfig, sendN8nOutbound, type N8nConfig } from "@/lib/integrations/n8n.functions";
import { CdnPanel } from "@/components/admin/CdnPanel";


export const Route = createFileRoute("/_authenticated/admin/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getN8nConfig);
  const save = useServerFn(saveN8nConfig);
  const test = useServerFn(sendN8nOutbound);

  const { data, isLoading } = useQuery({ queryKey: ["integrations", "n8n"], queryFn: () => get() });
  const [cfg, setCfg] = useState<N8nConfig>({ outbound_webhook_url: "", enabled: false, auto_publish_blog: false });
  useEffect(() => { if (data) setCfg(data); }, [data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: cfg }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["integrations", "n8n"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status: number; response: string } | null>(null);

  async function runTest() {
    setTesting(true); setTestResult(null);
    try {
      const res = await test({
        data: {
          event: "test",
          language: "en",
          title: "Test ping from Egytic admin",
          excerpt: "This is a connectivity test between the site and n8n.",
          url: window.location.origin,
          image_url: null,
          tags: ["test"],
          content_type: "article",
          slug: "test",
          post_id: "test",
        },
      });
      setTestResult(res);
      res.ok ? toast.success(`OK · ${res.status} · ${res.duration_ms}ms`) : toast.error(`Failed · ${res.status}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Test failed");
    } finally {
      setTesting(false);
    }
  }

  const inboundUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/hooks/n8n-inbound` : "";

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  if (isLoading) return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Webhook className="h-7 w-7 text-primary" /> Integrations · n8n & CDN
        </h1>
        <p className="mt-1 text-muted-foreground">
          مزامنة تلقائية بين الموقع وصفحات السوشيال ميديا عبر n8n، وإعدادات الـCDN.
        </p>
      </header>

      <CdnPanel />


      {/* Steps */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">خطوات الإعداد · Setup steps</h2>
        <ol className="list-decimal space-y-2 ps-6 text-sm leading-relaxed">
          <li>حمّل ملف الـWorkflow من الزر أدناه واستورده في n8n (Import from File).</li>
          <li>في n8n، افتح عقدة <code>Site → n8n (blog.published)</code> وانسخ الـProduction Webhook URL.</li>
          <li>الصقه هنا في حقل <b>Outbound webhook URL</b>، فعّل <b>Enabled</b>، ثم اضغط <b>Save</b>.</li>
          <li>اضغط <b>Send test</b> للتأكد من الاتصال.</li>
          <li>في n8n، أضف عقد <b>Facebook / Instagram / LinkedIn / Telegram</b> بعد الـWebhook وضع بيانات صفحاتك.</li>
          <li>للاتجاه المعاكس (فيسبوك ← الموقع): اضبط عقدة <code>Site ← n8n</code> على الـInbound URL أدناه واستخدم <code>x-n8n-secret</code>.</li>
        </ol>
      </section>

      {/* Outbound */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">Outbound · الموقع ← n8n</h2>
        <div className="space-y-2">
          <Label>Outbound webhook URL (from n8n)</Label>
          <Input
            placeholder="https://your-n8n.example.com/webhook/egytic-blog-published"
            value={cfg.outbound_webhook_url}
            onChange={(e) => setCfg({ ...cfg, outbound_webhook_url: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
            <span className="text-sm">Enabled · مفعّل</span>
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={cfg.auto_publish_blog} onCheckedChange={(v) => setCfg({ ...cfg, auto_publish_blog: v })} />
            <span className="text-sm">Auto-send on blog publish · إرسال تلقائي عند نشر المقال</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="outline" onClick={runTest} disabled={testing || !cfg.enabled || !cfg.outbound_webhook_url}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send test
          </Button>
          <a href="/n8n/egytic-facebook-sync.json" download>
            <Button variant="secondary"><Download className="h-4 w-4 mr-2" /> Download workflow (.json)</Button>
          </a>
        </div>
        {testResult && (
          <div className={`flex items-start gap-2 rounded border p-3 text-sm ${testResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
            {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /> : <XCircle className="h-4 w-4 text-rose-600 mt-0.5" />}
            <div className="flex-1">
              <div>Status: <Badge variant="secondary">{testResult.status}</Badge></div>
              {testResult.response && <pre className="mt-2 whitespace-pre-wrap text-xs opacity-70">{testResult.response}</pre>}
            </div>
          </div>
        )}
      </section>

      {/* Inbound */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">Inbound · n8n ← الموقع</h2>
        <p className="text-sm text-muted-foreground">
          استخدم هذا الرابط في n8n لإرسال منشورات من فيسبوك تُحفظ في الموقع كمسودات للمراجعة.
        </p>
        <div className="space-y-2">
          <Label>Inbound URL (POST)</Label>
          <div className="flex gap-2">
            <Input readOnly value={inboundUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy(inboundUrl)}><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Header (shared secret)</Label>
          <div className="flex gap-2">
            <Input readOnly value="x-n8n-secret: <N8N_INBOUND_SECRET>" className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy("x-n8n-secret")}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">
            السرّ محفوظ في متغيّرات البيئة على السيرفر باسم <code>N8N_INBOUND_SECRET</code>. اضبط نفس القيمة في n8n
            (مثلاً كـEnvironment Variable) واستخدمها في الـHeader.
          </p>
        </div>
        <div className="rounded bg-muted p-3">
          <p className="text-xs font-medium mb-2">Expected JSON body:</p>
          <pre className="text-xs whitespace-pre-wrap">{`{
  "title_en": "Post title",
  "title_ar": "عنوان المقال",
  "content_en": "Full text ...",
  "content_ar": "النص الكامل ...",
  "excerpt_en": "Short summary",
  "excerpt_ar": "ملخص قصير",
  "featured_image": "https://.../image.jpg",
  "source": "facebook",
  "source_url": "https://facebook.com/...",
  "tags": ["news"],
  "content_type": "article"
}`}</pre>
        </div>
      </section>

      {/* Payload spec */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Outbound payload · ما يُرسله الموقع إلى n8n</h2>
        <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded">{`{
  "event": "blog.published",
  "language": "en" | "ar",
  "title": "...",
  "excerpt": "...",
  "url": "https://your-site/knowledge/...",
  "image_url": "https://.../cover.jpg",
  "tags": ["..."],
  "content_type": "article",
  "slug": "...",
  "post_id": "uuid",
  "sent_at": "ISO-8601"
}`}</pre>
      </section>

      <section className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-5">
        <h2 className="text-lg font-semibold mb-2">التطوير التالي · Roadmap</h2>
        <ul className="list-disc ps-6 text-sm space-y-1 text-muted-foreground">
          <li>إعادة صياغة البوست وتوليد الهاشتاجات بالذكاء الاصطناعي قبل الإرسال (متوفر في /admin/ai).</li>
          <li>توليد صورة اجتماعية تلقائيًا (Lovable AI · imagegen) وإرفاقها بالبوست.</li>
          <li>نشر متزامن على Instagram / LinkedIn / Telegram من نفس الـWorkflow.</li>
          <li>مراجعة بشرية اختيارية عبر خطوة Approval في n8n قبل النشر.</li>
        </ul>
      </section>
    </div>
  );
}
