import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import {
  Award,
  BookOpen,
  Building2,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  MapPin,
  Image as ImageIcon,
  Images,
  Inbox,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageSquareQuote,
  Package,
  RefreshCw,
  Search,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/hero-slides", label: "Hero Slider", icon: GalleryHorizontalEnd },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/about", label: "About Page", icon: FileText },
  { to: "/admin/legal", label: "Legal (Privacy/Terms)", icon: FileText },
  { to: "/admin/services", label: "Services", icon: Layers },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/governorates", label: "Governorates", icon: MapPin },
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/downloads", label: "Downloads", icon: Download },
  { to: "/admin/downloads-analytics", label: "Downloads Analytics", icon: BarChart3 },
  { to: "/admin/clients", label: "Clients", icon: Building2 },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/faqs", label: "FAQ Items", icon: ClipboardList },
  { to: "/admin/careers", label: "Job Openings", icon: Users },
  { to: "/admin/applications", label: "Applications", icon: Inbox },
  { to: "/admin/newsletter", label: "Newsletter", icon: Inbox },
  { to: "/admin/seo", label: "SEO Manager", icon: Search },
  { to: "/admin/social-cache", label: "Social cache", icon: RefreshCw },
  { to: "/admin/qa-reports", label: "QA Reports", icon: LayoutDashboard },
  { to: "/admin/audit-logs", label: "Audit Log", icon: ClipboardList },
  { to: "/admin/media", label: "Media Library", icon: ImageIcon },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/settings-keys", label: "Settings Keys (JSON)", icon: Settings },
  { to: "/admin/users", label: "Users & Roles", icon: Users },

];

interface Notification { id: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null }

function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read_at).length;

  async function load() {
    const { data } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(20);
    setItems((data as Notification[] | null) ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-notif").on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, load).subscribe();
    const t = setInterval(load, 60_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  async function markAllRead() {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    await supabase.from("admin_notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    load();
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button className="text-xs text-primary hover:underline" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">Nothing yet.</div>}
            {items.map((n) => (
              <a key={n.id} href={n.link ?? "#"} className={`block p-3 text-xs hover:bg-muted/40 ${!n.read_at ? "bg-primary/5" : ""}`}>
                <div className="font-medium text-foreground">{n.title}</div>
                {n.body && <div className="mt-0.5 text-muted-foreground">{n.body}</div>}
                <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-6 py-5">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="rounded-lg bg-gradient-primary px-2 py-1 text-primary-foreground">Egytic</span>
            <span className="text-sm text-muted-foreground">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ExternalLink className="h-4 w-4" /> View public site
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="flex items-center gap-2 lg:hidden">
              <select
                aria-label="Admin section"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={pathname.startsWith("/admin/") ? pathname : "/admin"}
                onChange={(event) => navigate({ to: event.target.value as "/admin" })}
              >
                {nav.map((item) => <option key={item.to} value={item.to}>{item.label}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
