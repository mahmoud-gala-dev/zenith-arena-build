import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/social-cache")({
  beforeLoad: async () => {
    const { data, error } = await supabase.rpc("is_staff");
    if (error || !data) {
      throw redirect({ to: "/" });
    }
  },
  component: SocialCachePage,
});


interface Result {
  target: string;
  ok: boolean;
  status?: number;
  message?: string;
}

function SocialCachePage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [posts, setPosts] = useState<Array<{ slug_en: string; title_en: string; updated_at: string }>>([]);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("slug_en,title_en,updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(15)
      .then(({ data }) => setPosts(data ?? []));
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/`);
    }
  }, []);

  const pickPost = (slug: string) => {
    setUrl(`${window.location.origin}/knowledge/${slug}`);
    setResults([]);
  };

  const openDebuggers = () => {
    const enc = encodeURIComponent(url);
    const targets = [
      { name: "Facebook", href: `https://developers.facebook.com/tools/debug/?q=${enc}` },
      { name: "LinkedIn", href: `https://www.linkedin.com/post-inspector/inspect/${enc}` },
      { name: "Twitter / X", href: `https://cards-dev.twitter.com/validator?url=${enc}` },
    ];
    targets.forEach((t) => window.open(t.href, "_blank", "noopener"));
  };

  const pingFacebook = async () => {
    setBusy(true);
    setResults([]);
    const out: Result[] = [];
    try {
      // Facebook scrape API — anonymous POST re-scrapes the URL and updates og cache.
      const fb = await fetch(
        `https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true`,
        { method: "POST" },
      ).catch((e) => ({ ok: false, status: 0, statusText: String(e) } as Response));
      out.push({
        target: "Facebook Graph rescrape",
        ok: fb.ok,
        status: fb.status,
        message: fb.ok ? "Cache refreshed" : `Failed (${fb.status})`,
      });
    } catch (e) {
      out.push({ target: "Facebook Graph rescrape", ok: false, message: String(e) });
    }
    // LinkedIn and Twitter don't expose an anonymous refresh API — open their debuggers.
    out.push({
      target: "LinkedIn Post Inspector",
      ok: true,
      message: "Open debugger below to refresh (no public API).",
    });
    out.push({
      target: "Twitter / X Card Validator",
      ok: true,
      message: "Open debugger below to refresh (no public API).",
    });
    setResults(out);
    setBusy(false);
  };

  return (
    <AdminShell title="Social preview cache">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <RefreshCw className="h-5 w-5 text-primary" />
            Refresh og:image / preview cache
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When you update a Knowledge article's SEO or og:image in the admin, social platforms may serve
            the old preview for hours. Use this page after saving to force a re-scrape.
          </p>

          <div className="mt-6 space-y-3">
            <Label htmlFor="url">Public URL to refresh</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-site.com/knowledge/slug"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={pingFacebook} disabled={!url || busy}>
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                Ping Facebook rescrape
              </Button>
              <Button variant="outline" onClick={openDebuggers} disabled={!url}>
                <ExternalLink className="h-4 w-4" />
                Open all debuggers
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <ul className="mt-6 space-y-2">
              {results.map((r) => (
                <li
                  key={r.target}
                  className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm"
                >
                  {r.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{r.target}</p>
                    <p className="text-muted-foreground">{r.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Facebook exposes an anonymous rescrape endpoint (used above). LinkedIn and Twitter/X require
              signing in to their debuggers — opening them counts as a refresh.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="text-base font-semibold text-foreground">Recent Knowledge articles</h3>
          <p className="text-xs text-muted-foreground">Pick one to prefill the URL above.</p>
          <ul className="mt-4 divide-y divide-border">
            {posts.map((p) => (
              <li key={p.slug_en} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.title_en}</p>
                  <p className="truncate text-xs text-muted-foreground">/knowledge/{p.slug_en}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => pickPost(p.slug_en)}>
                  Use
                </Button>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">No published articles yet.</li>
            )}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
