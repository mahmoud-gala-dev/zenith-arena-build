import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/legal")({
  component: AdminLegalPage,
});

type Section = { h: string; body: string };
type LangContent = { title: string; intro: string; sections: Section[] };
type PageForm = {
  id?: string;
  en: LangContent;
  ar: LangContent;
  status: "published" | "draft";
  effectiveAt: string; // datetime-local value or ""
};

const SLUGS = [
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
] as const;

function parse(md: string): { intro: string; sections: Section[] } {
  const text = (md ?? "").trim();
  if (!text) return { intro: "", sections: [] };
  const parts = text.split(/\n##\s+/);
  const intro = parts[0].startsWith("## ") ? "" : parts.shift() ?? "";
  const sections: Section[] = parts.map((chunk) => {
    const cleaned = chunk.replace(/^##\s+/, "");
    const nl = cleaned.indexOf("\n");
    if (nl === -1) return { h: cleaned.trim(), body: "" };
    return { h: cleaned.slice(0, nl).trim(), body: cleaned.slice(nl + 1).trim() };
  });
  return { intro: intro.trim(), sections };
}

function serialize(intro: string, sections: Section[]): string {
  const introPart = intro.trim();
  const sectionPart = sections
    .map((s) => `## ${s.h.trim()}\n${s.body.trim()}`)
    .join("\n\n");
  return [introPart, sectionPart].filter(Boolean).join("\n\n");
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminLegalPage() {
  const [active, setActive] = useState<string>(SLUGS[0].slug);
  return (
    <AdminShell title="Legal Pages">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          {SLUGS.map((s) => (
            <TabsTrigger key={s.slug} value={s.slug}>{s.label}</TabsTrigger>
          ))}
        </TabsList>
        {SLUGS.map((s) => (
          <TabsContent key={s.slug} value={s.slug} className="mt-6">
            <LegalEditor slug={s.slug} label={s.label} />
          </TabsContent>
        ))}
      </Tabs>
    </AdminShell>
  );
}

function LegalEditor({ slug, label }: { slug: string; label: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "legal", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<PageForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data && !isLoading) {
      setForm({
        en: { title: label, intro: "", sections: [] },
        ar: { title: label, intro: "", sections: [] },
        status: "draft",
        effectiveAt: "",
      });
      return;
    }
    if (data) {
      const en = parse(data.content_en ?? "");
      const ar = parse(data.content_ar ?? "");
      setForm({
        id: data.id,
        en: { title: data.title_en ?? label, intro: en.intro, sections: en.sections },
        ar: { title: data.title_ar ?? label, intro: ar.intro, sections: ar.sections },
        status: (data.status as "published" | "draft") ?? "draft",
        effectiveAt: toLocalInput((data as { effective_at?: string | null }).effective_at ?? null),
      });
    }
  }, [data, isLoading, label]);

  const canSave = useMemo(() => !!form && !saving, [form, saving]);

  const isLive = useMemo(() => {
    if (!form) return false;
    if (form.status !== "published") return false;
    if (!form.effectiveAt) return true;
    return new Date(form.effectiveAt).getTime() <= Date.now();
  }, [form]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const payload = {
        slug_en: slug,
        slug_ar: slug,
        title_en: form.en.title,
        title_ar: form.ar.title,
        content_en: serialize(form.en.intro, form.en.sections),
        content_ar: serialize(form.ar.intro, form.ar.sections),
        template: "legal",
        status: form.status,
        effective_at: form.effectiveAt ? new Date(form.effectiveAt).toISOString() : null,
      };
      const q = form.id
        ? supabase.from("pages").update(payload).eq("id", form.id)
        : supabase.from("pages").insert(payload);
      const { error } = await q;
      if (error) throw error;
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "legal", slug] });
      qc.invalidateQueries({ queryKey: ["pages", "by-slug", slug] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        {(["en", "ar"] as const).map((lang) => (
          <TabsContent key={lang} value={lang} className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <LangEditor
                rtl={lang === "ar"}
                value={form[lang]}
                onChange={(next) => setForm({ ...form, [lang]: next })}
              />
              <LivePreview rtl={lang === "ar"} value={form[lang]} />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save} disabled={!canSave}>{saving ? "Saving…" : "Save"}</Button>
      </div>

      <AuditHistory recordId={form.id} />
    </div>
  );
}

type AuditRow = {
  id: string;
  actor_email: string | null;
  actor_id: string | null;
  action: string;
  created_at: string;
  changes: { diff?: Record<string, unknown> } | null;
};

function AuditHistory({ recordId }: { recordId?: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "legal", "audit", recordId ?? "none"],
    enabled: !!recordId,
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, actor_email, actor_id, action, created_at, changes")
        .eq("table_name", "pages")
        .eq("record_id", recordId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  if (!recordId) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Edit history</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Save the page first to start tracking changes.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Edit history</CardTitle>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {data.map((row) => {
              const fields = row.changes?.diff ? Object.keys(row.changes.diff) : [];
              return (
                <li key={row.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                      {row.action}
                    </span>
                    <span className="font-medium">{row.actor_email ?? row.actor_id ?? "System"}</span>
                    <span className="text-muted-foreground">
                      · {new Date(row.created_at).toLocaleString()}
                    </span>
                  </div>
                  {fields.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Changed: {fields.join(", ")}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LivePreview({ value, rtl }: { value: LangContent; rtl?: boolean }) {
  return (
    <div className="lg:sticky lg:top-4 lg:self-start">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live preview
      </div>
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="max-h-[80vh] overflow-y-auto rounded-lg border bg-background p-6"
      >
        <h1 className="text-2xl font-bold text-foreground">{value.title || "Untitled"}</h1>
        {value.intro && (
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
            {value.intro}
          </p>
        )}
        <div className="mt-6 space-y-6">
          {value.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-foreground">{s.h || `Section ${i + 1}`}</h2>
              {s.body && (
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              )}
            </section>
          ))}
          {value.sections.length === 0 && (
            <p className="text-sm italic text-muted-foreground">No sections yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}


function LangEditor({
  value,
  onChange,
  rtl,
}: {
  value: LangContent;
  onChange: (next: LangContent) => void;
  rtl?: boolean;
}) {
  const dir = rtl ? "rtl" : "ltr";

  function updateSection(i: number, patch: Partial<Section>) {
    const next = value.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...value, sections: next });
  }
  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= value.sections.length) return;
    const next = [...value.sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...value, sections: next });
  }
  function remove(i: number) {
    onChange({ ...value, sections: value.sections.filter((_, idx) => idx !== i) });
  }
  function add() {
    onChange({ ...value, sections: [...value.sections, { h: "", body: "" }] });
  }

  return (
    <div className="space-y-4" dir={dir}>
      <div className="grid gap-2">
        <Label>Title</Label>
        <Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label>Intro</Label>
        <Textarea
          rows={3}
          value={value.intro}
          onChange={(e) => onChange({ ...value, intro: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Sections</Label>
          <Button type="button" size="sm" variant="outline" onClick={add}>
            <Plus className="me-1 h-4 w-4" /> Add section
          </Button>
        </div>
        {value.sections.length === 0 && (
          <p className="text-sm text-muted-foreground">No sections yet.</p>
        )}
        {value.sections.map((s, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 py-3">
              <CardTitle className="text-sm">Section {i + 1}</CardTitle>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === value.sections.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Heading"
                value={s.h}
                onChange={(e) => updateSection(i, { h: e.target.value })}
              />
              <Textarea
                rows={5}
                placeholder="Body"
                value={s.body}
                onChange={(e) => updateSection(i, { body: e.target.value })}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
