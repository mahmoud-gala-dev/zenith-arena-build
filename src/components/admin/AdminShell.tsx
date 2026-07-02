import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, FolderKanban, Image as ImageIcon, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/media", label: "Media Library", icon: ImageIcon },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-6 py-5">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="rounded-lg bg-gradient-primary px-2 py-1 text-primary-foreground">APEX</span>
            <span className="text-sm text-muted-foreground">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
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
          <Button variant="outline" size="sm" onClick={signOut} className="lg:hidden">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
