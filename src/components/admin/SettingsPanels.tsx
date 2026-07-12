import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import {
  useContactInfo,
  useSocialLinks,
  useBrandName,
  useSeoDefaults,
  DEFAULT_CONTACT_INFO,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_BRAND_NAME,
  DEFAULT_SEO_DEFAULTS,
  type ContactInfo,
  type SocialLinks,
  type BrandName,
  type SeoDefaults,
  type Office,
} from "@/lib/settings";
import { Textarea } from "@/components/ui/textarea";

async function saveSetting(key: string, value: unknown) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: value as never, is_public: true }, { onConflict: "key" });
  if (error) throw error;
}


export function ContactInfoPanel() {
  const initial = useContactInfo();
  const qc = useQueryClient();
  const [v, setV] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  useEffect(() => { setV(initial); }, [initial]);

  const save = useMutation({
    mutationFn: () => saveSetting("contact_info", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "contact_info"] });
      toast.success("Contact info saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateOffice = (i: number, patch: Partial<Office>) =>
    setV({ ...v, offices: v.offices.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Shown in the footer, contact page and structured data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="+20 100 000 0000" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input
              value={v.whatsapp}
              onChange={(e) => setV({ ...v, whatsapp: e.target.value })}
              placeholder="+20100000000"
            />
            <p className="text-xs text-muted-foreground">Digits only or international format — used for wa.me links.</p>
          </div>
          <div className="space-y-2">
            <Label>Working hours (EN)</Label>
            <Input value={v.hours_en} onChange={(e) => setV({ ...v, hours_en: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Working hours (AR)</Label>
            <Input dir="rtl" value={v.hours_ar} onChange={(e) => setV({ ...v, hours_ar: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Offices</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setV({
                  ...v,
                  offices: [
                    ...v.offices,
                    { city_en: "", city_ar: "", country_en: "", country_ar: "", address_en: "", address_ar: "" },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add office
            </Button>
          </div>
          {v.offices.map((o, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
              <Input placeholder="City (EN)" value={o.city_en} onChange={(e) => updateOffice(i, { city_en: e.target.value })} />
              <Input dir="rtl" placeholder="City (AR)" value={o.city_ar} onChange={(e) => updateOffice(i, { city_ar: e.target.value })} />
              <Input placeholder="Country (EN)" value={o.country_en} onChange={(e) => updateOffice(i, { country_en: e.target.value })} />
              <Input dir="rtl" placeholder="Country (AR)" value={o.country_ar} onChange={(e) => updateOffice(i, { country_ar: e.target.value })} />
              <Input placeholder="Address (EN)" value={o.address_en ?? ""} onChange={(e) => updateOffice(i, { address_en: e.target.value })} />
              <Input dir="rtl" placeholder="Address (AR)" value={o.address_ar ?? ""} onChange={(e) => updateOffice(i, { address_ar: e.target.value })} />
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setV({ ...v, offices: v.offices.filter((_, idx) => idx !== i) })}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const socialFields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/..." },
  { key: "x", label: "X (Twitter)", placeholder: "https://twitter.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@..." },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "+20100000000" },
];

export function SocialLinksPanel() {
  const initial = useSocialLinks();
  const qc = useQueryClient();
  const [v, setV] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  useEffect(() => { setV(initial); }, [initial]);

  const save = useMutation({
    mutationFn: () => saveSetting("social_links", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "social_links"] });
      toast.success("Social links saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Empty fields are hidden across the site automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {socialFields.map((f) => (
            <div className="space-y-2" key={f.key}>
              <Label>{f.label}</Label>
              <Input
                value={v[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrandNamePanel() {
  const initial = useBrandName();
  const qc = useQueryClient();
  const [v, setV] = useState<BrandName>(DEFAULT_BRAND_NAME);
  useEffect(() => { setV(initial); }, [initial]);

  const save = useMutation({
    mutationFn: () => saveSetting("brand_name", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "brand_name"] });
      toast.success("Brand name saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Name & Tagline</CardTitle>
        <CardDescription>Displayed in metadata, footer copyright and structured data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Brand name (EN)</Label>
            <Input value={v.en} onChange={(e) => setV({ ...v, en: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Brand name (AR)</Label>
            <Input dir="rtl" value={v.ar} onChange={(e) => setV({ ...v, ar: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tagline (EN)</Label>
            <Input value={v.tagline_en} onChange={(e) => setV({ ...v, tagline_en: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tagline (AR)</Label>
            <Input dir="rtl" value={v.tagline_ar} onChange={(e) => setV({ ...v, tagline_ar: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SeoDefaultsPanel() {
  const initial = useSeoDefaults();
  const qc = useQueryClient();
  const [v, setV] = useState<SeoDefaults>(DEFAULT_SEO_DEFAULTS);
  useEffect(() => { setV(initial); }, [initial]);

  const save = useMutation({
    mutationFn: () => saveSetting("seo_defaults", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "seo_defaults"] });
      toast.success("SEO defaults saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof SeoDefaults>(k: K, val: SeoDefaults[K]) => setV({ ...v, [k]: val });

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Defaults</CardTitle>
        <CardDescription>
          Global fallback metadata used by the root layout and every page that doesn't set its own.
          Changes may take a few minutes to appear in social share previews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Site name (EN)</Label>
            <Input value={v.site_name_en} onChange={(e) => set("site_name_en", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Site name (AR)</Label>
            <Input dir="rtl" value={v.site_name_ar} onChange={(e) => set("site_name_ar", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Default title (EN)</Label>
            <Input value={v.default_title_en} onChange={(e) => set("default_title_en", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Default title (AR)</Label>
            <Input dir="rtl" value={v.default_title_ar} onChange={(e) => set("default_title_ar", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Default description (EN)</Label>
            <Textarea rows={3} value={v.default_description_en} onChange={(e) => set("default_description_en", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Default description (AR)</Label>
            <Textarea dir="rtl" rows={3} value={v.default_description_ar} onChange={(e) => set("default_description_ar", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Default OG image URL</Label>
            <Input value={v.default_og_image_url} onChange={(e) => set("default_og_image_url", e.target.value)} placeholder="https://.../og.jpg (1200×630)" />
            <p className="text-xs text-muted-foreground">Used as the social share fallback across the site.</p>
          </div>
          <div className="space-y-2">
            <Label>Twitter handle</Label>
            <Input value={v.twitter_handle} onChange={(e) => set("twitter_handle", e.target.value)} placeholder="@egytic" />
          </div>
          <div className="space-y-2">
            <Label>Theme color</Label>
            <Input type="color" value={v.theme_color} onChange={(e) => set("theme_color", e.target.value)} className="h-10 w-24 p-1" />
          </div>
          <div className="space-y-2">
            <Label>Author / Publisher</Label>
            <Input value={v.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Title template (EN)</Label>
            <Input value={v.title_template_en} onChange={(e) => set("title_template_en", e.target.value)} placeholder="{page} — {site}" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Title template (AR)</Label>
            <Input dir="rtl" value={v.title_template_ar} onChange={(e) => set("title_template_ar", e.target.value)} placeholder="{page} — {site}" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
