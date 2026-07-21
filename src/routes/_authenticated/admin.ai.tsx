import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Trash2, Plus, RefreshCw } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  component: AdminAIPage,
});

type Glossary = Array<{ term: string; translation: string; note?: string }>;
type Settings = {
  id?: string;
  default_model: string;
  advanced_model: string;
  tone: string;
  glossary: Glossary;
  daily_user_limit: number;
  enabled: boolean;
};

const DEFAULTS: Settings = {
  default_model: "google/gemini-3-flash-preview",
  advanced_model: "google/gemini-3-pro-preview",
  tone: "professional",
  glossary: [],
  daily_user_limit: 200,
  enabled: true,
};

type Log = {
  id: string;
  user_id: string | null;
  action: string;
  model: string;
  total_tokens: number | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  target_table: string | null;
  target_id: string | null;
  created_at: string;
};

function AdminAIPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filterAction, setFilterAction] = useState("");
  const [filterSuccess, setFilterSuccess] = useState<"all" | "ok" | "err">("all");

  async function loadSettings() {
    const { data } = await supabase
      .from("ai_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettings({
        id: data.id,
        default_model: data.default_model ?? DEFAULTS.default_model,
        advanced_model: data.advanced_model ?? DEFAULTS.advanced_model,
        tone: data.tone ?? DEFAULTS.tone,
        glossary: (data.glossary as Glossary) ?? [],
        daily_user_limit: data.daily_user_limit ?? DEFAULTS.daily_user_limit,
        enabled: data.enabled ?? true,
      });
    }
    setLoading(false);
  }

  async function loadLogs() {
    const { data } = await supabase
      .from("ai_usage_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLogs((data as Log[] | null) ?? []);
  }

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  async function save() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      default_model: settings.default_model,
      advanced_model: settings.advanced_model,
      tone: settings.tone,
      glossary: settings.glossary as unknown as any,
      daily_user_limit: settings.daily_user_limit,
      enabled: settings.enabled,
      updated_by: userData.user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    const q = settings.id
      ? supabase.from("ai_settings").update(payload).eq("id", settings.id)
      : supabase.from("ai_settings").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("AI settings saved");
      loadSettings();
    }
  }

  function addTerm() {
    setSettings((s) => ({ ...s, glossary: [...s.glossary, { term: "", translation: "", note: "" }] }));
  }
  function removeTerm(i: number) {
    setSettings((s) => ({ ...s, glossary: s.glossary.filter((_, idx) => idx !== i) }));
  }
  function updateTerm(i: number, patch: Partial<Glossary[number]>) {
    setSettings((s) => ({
      ...s,
      glossary: s.glossary.map((g, idx) => (idx === i ? { ...g, ...patch } : g)),
    }));
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterAction && !l.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
      if (filterSuccess === "ok" && !l.success) return false;
      if (filterSuccess === "err" && l.success) return false;
      return true;
    });
  }, [logs, filterAction, filterSuccess]);

  const stats = useMemo(() => {
    const totalCalls = logs.length;
    const totalTokens = logs.reduce((sum, l) => sum + (l.total_tokens ?? 0), 0);
    const errors = logs.filter((l) => !l.success).length;
    const avgLatency = logs.length
      ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms ?? 0), 0) / logs.length)
      : 0;
    return { totalCalls, totalTokens, errors, avgLatency };
  }, [logs]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { day: string; calls: number; tokens: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { day: key.slice(5), calls: 0, tokens: 0 });
    }
    for (const l of logs) {
      const key = l.created_at.slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      b.calls++;
      b.tokens += l.total_tokens ?? 0;
    }
    return Array.from(buckets.values());
  }, [logs]);

  const byAction = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) m.set(l.action, (m.get(l.action) ?? 0) + 1);
    return Array.from(m.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  return (
    <AdminShell title="AI Command Center">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Command Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إدارة الإعدادات الذكية ومراقبة الاستهلاك عبر جميع أدوات المحتوى.
            </p>
          </div>
          <Button variant="outline" onClick={() => { loadSettings(); loadLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total AI calls" value={stats.totalCalls.toLocaleString()} />
          <StatCard label="Total tokens" value={stats.totalTokens.toLocaleString()} />
          <StatCard label="Errors" value={stats.errors.toLocaleString()} tone={stats.errors ? "warn" : "ok"} />
          <StatCard label="Avg latency" value={`${stats.avgLatency} ms`} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Calls — last 7 days</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top actions</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byAction} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="action" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <AutoSeoCard />

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle>Settings — إعدادات الذكاء الاصطناعي</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">Enable AI assistance</div>
                    <div className="text-xs text-muted-foreground">
                      إيقاف يعطّل جميع أزرار المساعد الذكي في لوحة الأدمن.
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Default model</Label>
                    <Input
                      value={settings.default_model}
                      onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      نموذج سريع للمهام اليومية (اقترح <code>google/gemini-3-flash-preview</code>).
                    </p>
                  </div>
                  <div>
                    <Label>Advanced model</Label>
                    <Input
                      value={settings.advanced_model}
                      onChange={(e) => setSettings({ ...settings, advanced_model: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      نموذج قوي للمهام المعقدة (مثال: <code>google/gemini-3-pro-preview</code>).
                    </p>
                  </div>
                  <div>
                    <Label>Brand tone</Label>
                    <Input
                      value={settings.tone}
                      onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                      placeholder="professional, warm, technical…"
                    />
                  </div>
                  <div>
                    <Label>Daily user limit</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.daily_user_limit}
                      onChange={(e) =>
                        setSettings({ ...settings, daily_user_limit: parseInt(e.target.value || "0") })
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label>Glossary — قاموس الترجمة</Label>
                      <p className="text-xs text-muted-foreground">
                        كلمات يجب على الذكاء الاصطناعي الحفاظ عليها كما هي عند الترجمة.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={addTerm}>
                      <Plus className="h-4 w-4 mr-1" /> Add term
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {settings.glossary.length === 0 && (
                      <div className="text-sm text-muted-foreground italic">No glossary terms yet.</div>
                    )}
                    {settings.glossary.map((g, i) => (
                      <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] items-center">
                        <Input
                          value={g.term}
                          onChange={(e) => updateTerm(i, { term: e.target.value })}
                          placeholder="EN term"
                        />
                        <Input
                          value={g.translation}
                          onChange={(e) => updateTerm(i, { translation: e.target.value })}
                          placeholder="AR translation"
                          dir="rtl"
                        />
                        <Input
                          value={g.note ?? ""}
                          onChange={(e) => updateTerm(i, { note: e.target.value })}
                          placeholder="Note (optional)"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeTerm(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={save} disabled={saving}>
                    {saving ? "Saving…" : "Save settings"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Usage logs — سجل الاستهلاك</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter by action…"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-48"
                />
                <select
                  className="border rounded-md h-9 px-2 text-sm bg-background"
                  value={filterSuccess}
                  onChange={(e) => setFilterSuccess(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="ok">Success</option>
                  <option value="err">Errors</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 200).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(l.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.action}</TableCell>
                      <TableCell className="text-xs">{l.model}</TableCell>
                      <TableCell className="text-xs">{l.total_tokens ?? 0}</TableCell>
                      <TableCell className="text-xs">{l.duration_ms ?? 0} ms</TableCell>
                      <TableCell className="text-xs">
                        {l.target_table ? `${l.target_table}${l.target_id ? `#${l.target_id.slice(0, 6)}` : ""}` : "—"}
                      </TableCell>
                      <TableCell>
                        {l.success ? (
                          <Badge variant="secondary">OK</Badge>
                        ) : (
                          <Badge variant="destructive" title={l.error_message ?? ""}>Error</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-6">
                        No usage recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${tone === "warn" ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
