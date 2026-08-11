import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  KeyRound, Plus, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, Save, Cpu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { aiKeysList, aiKeySave, aiKeyDelete, aiKeyTest } from "@/lib/ai/keys.functions";

type KeyRow = {
  id: string;
  provider: string;
  label: string;
  masked: string;
  active: boolean;
  priority: number;
  last_status: string | null;
  last_error: string | null;
  last_tested_at: string | null;
};

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

export function AiProviderPanel() {
  const listKeys = useServerFn(aiKeysList);
  const saveKey = useServerFn(aiKeySave);
  const deleteKey = useServerFn(aiKeyDelete);
  const testKey = useServerFn(aiKeyTest);

  const [provider, setProvider] = useState<"lovable" | "gemini">("lovable");
  const [geminiModel, setGeminiModel] = useState("gemini-3.5-flash");
  const [rotate, setRotate] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [adding, setAdding] = useState(false);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("ai_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const row = data as unknown as Record<string, unknown>;
      setSettingsId(String(row.id));
      setProvider((row.provider as "lovable" | "gemini") ?? "lovable");
      setGeminiModel((row.gemini_model as string) ?? "gemini-3.5-flash");
      setRotate((row.gemini_rotate_keys as boolean) ?? true);
    }
  }, []);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      setKeys((await listKeys()) as KeyRow[]);
      setKeysError(null);
    } catch (e) {
      setKeysError(e instanceof Error ? e.message : "Could not load keys");
    } finally {
      setLoadingKeys(false);
    }
  }, [listKeys]);

  useEffect(() => { loadSettings(); loadKeys(); }, [loadSettings, loadKeys]);

  async function persistSettings() {
    setSavingSettings(true);
    const payload = {
      provider,
      gemini_model: geminiModel,
      gemini_rotate_keys: rotate,
      updated_at: new Date().toISOString(),
    } as never;
    const { error } = settingsId
      ? await supabase.from("ai_settings").update(payload).eq("id", settingsId)
      : await supabase.from("ai_settings").insert(payload);
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    toast.success(`AI provider set to ${provider === "gemini" ? "Google Gemini" : "Lovable AI"}`);
    loadSettings();
  }

  async function addKey() {
    if (!newLabel.trim() || !newKey.trim()) return toast.error("Label and API key are required.");
    setAdding(true);
    try {
      await saveKey({ data: { label: newLabel.trim(), api_key: newKey.trim(), active: true, priority: keys.length } });
      setNewLabel(""); setNewKey("");
      toast.success("Key saved");
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save key");
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(row: KeyRow, active: boolean) {
    setBusyId(row.id);
    try {
      await saveKey({ data: { id: row.id, label: row.label, active, priority: row.priority } });
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function runTest(row: KeyRow) {
    setBusyId(row.id);
    try {
      const res = await testKey({ data: { id: row.id, model: geminiModel } });
      if (res.ok) toast.success(`${row.label}: OK (${res.latencyMs}ms)`);
      else toast.error(`${row.label}: ${res.error}`);
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeKey(row: KeyRow) {
    if (!confirm(`Delete key "${row.label}"?`)) return;
    setBusyId(row.id);
    try {
      await deleteKey({ data: { id: row.id } });
      toast.success("Key deleted");
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-4 w-4" /> AI provider — مزوّد الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Active provider</Label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "lovable" | "gemini")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="lovable">Lovable AI (built-in, no key)</option>
              <option value="gemini">Google Gemini (your API keys)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Gemini model</Label>
            <Input
              list="gemini-models"
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              disabled={provider !== "gemini"}
            />
            <datalist id="gemini-models">
              {GEMINI_MODELS.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch checked={rotate} onCheckedChange={setRotate} disabled={provider !== "gemini"} />
              <Label className="text-xs leading-tight">Rotate keys<br />on failure</Label>
            </div>
            <Button onClick={persistSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4" /> Google Gemini API keys
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add several keys — the highest priority active key is used first and the next one is tried
            automatically if a request fails or hits a quota. Keys are stored server-side and only ever
            shown masked. Super admins only.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input placeholder="Label (e.g. Primary)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            <Input type="password" placeholder="AIza…" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <Button onClick={addKey} disabled={adding}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add key
            </Button>
          </div>

          {keysError && <p className="mt-3 text-xs text-destructive">{keysError}</p>}

          <div className="mt-4 space-y-2">
            {loadingKeys ? (
              <p className="text-xs text-muted-foreground">Loading keys…</p>
            ) : keys.length === 0 ? (
              <p className="text-xs text-muted-foreground">No Gemini keys yet.</p>
            ) : keys.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background/60 p-3">
                <span className="font-medium">{k.label}</span>
                <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{k.masked}</code>
                {k.last_status === "ok" && (
                  <Badge variant="secondary" className="gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> OK</Badge>
                )}
                {k.last_status === "error" && (
                  <Badge variant="destructive" className="gap-1 text-[10px]" title={k.last_error ?? ""}><XCircle className="h-3 w-3" /> Error</Badge>
                )}
                <span className="text-xs text-muted-foreground">priority {k.priority}</span>
                <div className="ms-auto flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={k.active} disabled={busyId === k.id} onCheckedChange={(v) => toggleActive(k, v)} />
                    <span className="text-xs text-muted-foreground">{k.active ? "Active" : "Off"}</span>
                  </div>
                  <Button size="sm" variant="outline" disabled={busyId === k.id} onClick={() => runTest(k)}>
                    {busyId === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="ml-1">Test</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={busyId === k.id} onClick={() => removeKey(k)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {k.last_status === "error" && k.last_error && (
                  <p className="w-full text-xs text-destructive">{k.last_error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
