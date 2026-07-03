import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  { to: "/admin/services", label: "Services", icon: Layers },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/governorates", label: "Governorates", icon: MapPin },
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/downloads", label: "Downloads", icon: Download },
  { to: "/admin/clients", label: "Clients", icon: Building2 },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/seo", label: "SEO Manager", icon: Search },
  { to: "/admin/social-cache", label: "Social cache", icon: RefreshCw },
  { to: "/admin/qa-reports", label: "QA Reports", icon: LayoutDashboard },
  { to: "/admin/audit-logs", label: "Audit Log", icon: ClipboardList },
  { to: "/admin/media", label: "Media Library", icon: ImageIcon },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/users", label: "Users & Roles", icon: Users },
];

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
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
