import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});


type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Role = Database["public"]["Enums"]["app_role"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type Permission = Database["public"]["Tables"]["permissions"]["Row"];
type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"];

const roles: Role[] = ["super_admin", "admin", "editor", "content_manager", "sales_viewer"];

function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [profilesResult, rolesResult, permsResult, rpResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("permissions").select("*").order("key"),
      supabase.from("role_permissions").select("*"),
    ]);
    if (profilesResult.error) toast.error(profilesResult.error.message);
    if (rolesResult.error) toast.error(rolesResult.error.message);
    setProfiles((profilesResult.data ?? []) as Profile[]);
    setUserRoles((rolesResult.data ?? []) as UserRole[]);
    setPermissions((permsResult.data ?? []) as Permission[]);
    setRolePerms((rpResult.data ?? []) as RolePermission[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const hasPerm = (role: Role, permId: string) =>
    rolePerms.some((rp) => rp.role === role && rp.permission_id === permId);


  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((profile) => [profile.full_name, profile.email].some((value) => String(value ?? "").toLowerCase().includes(normalized)));
  }, [profiles, query]);

  function roleFor(userId: string) {
    return userRoles.find((item) => item.user_id === userId)?.role ?? "sales_viewer";
  }

  async function setRole(userId: string, role: Role) {
    setSavingId(userId);
    const existing = userRoles.filter((item) => item.user_id === userId);
    if (existing.length > 0) {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) {
        setSavingId(null);
        toast.error(deleteError.message);
        return;
      }
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      load();
      return;
    }
    toast.success("Role updated");
    setUserRoles((prev) => [...prev.filter((item) => item.user_id !== userId), { id: crypto.randomUUID(), user_id: userId, role, created_at: new Date().toISOString() }]);
  }

  return (
    <AdminShell title="Users & Roles">
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-foreground">Secure role management</h2>
              <p className="mt-1 text-sm text-muted-foreground">Roles are stored separately from profiles and can only be changed by authorized admins.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-semibold text-foreground">Role permissions matrix</h2>
            <span className="text-xs text-muted-foreground">{permissions.length} permissions × {roles.length} roles</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Permission</th>
                  {roles.map((r) => <th key={r} className="px-3 py-2 text-center">{r.replaceAll("_", " ")}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </td>
                    {roles.map((r) => (
                      <td key={r} className="px-3 py-2 text-center">
                        {hasPerm(r, p.id) ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users…" className="pl-9" />
        </div>


        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Current role</th><th className="px-4 py-3">Change role</th><th className="px-4 py-3">Joined</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" /> Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">No users found.</td></tr>
              ) : filtered.map((profile) => {
                const currentRole = roleFor(profile.id);
                return (
                  <tr key={profile.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{profile.full_name || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">{profile.email || profile.id}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{currentRole.replaceAll("_", " ")}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Select value={currentRole} onValueChange={(value) => setRole(profile.id, value as Role)} disabled={savingId === profile.id}>
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>{roles.map((role) => <SelectItem key={role} value={role}>{role.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                        </Select>
                        {savingId === profile.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
