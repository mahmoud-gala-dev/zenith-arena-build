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
type PageForm = { id?: string; en: LangContent; ar: LangContent };

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
      });
    }
  }, [data, isLoading, label]);

  const canSave = useMemo(() => !!form && !saving, [form, saving]);

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
        status: "published" as const,
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
          <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
            <LangEditor
              rtl={lang === "ar"}
              value={form[lang]}
              onChange={(next) => setForm({ ...form, [lang]: next })}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save} disabled={!canSave}>{saving ? "Saving…" : "Save"}</Button>
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
