import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useGuard } from "@/lib/rbac";
import { logAdminAudit } from "@/lib/admin-audit";


export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Role = Database["public"]["Enums"]["app_role"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type Permission = Database["public"]["Tables"]["permissions"]["Row"];
type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"];

const roles: Role[] = ["super_admin", "admin", "editor", "content_manager", "sales_viewer"];

type Matrix = Record<string, Set<Role>>;

function buildMatrix(perms: Permission[], rps: RolePermission[]): Matrix {
  const m: Matrix = {};
  for (const p of perms) m[p.id] = new Set<Role>();
  for (const rp of rps) m[rp.permission_id]?.add(rp.role);
  return m;
}

function cloneMatrix(m: Matrix): Matrix {
  const out: Matrix = {};
  for (const k of Object.keys(m)) out[k] = new Set(m[k]);
  return out;
}

function diffMatrix(a: Matrix, b: Matrix) {
  const toAdd: { role: Role; permission_id: string }[] = [];
  const toRemove: { role: Role; permission_id: string }[] = [];
  for (const permId of Object.keys(b)) {
    const before = a[permId] ?? new Set<Role>();
    const after = b[permId] ?? new Set<Role>();
    for (const r of after) if (!before.has(r)) toAdd.push({ role: r, permission_id: permId });
    for (const r of before) if (!after.has(r)) toRemove.push({ role: r, permission_id: permId });
  }
  return { toAdd, toRemove };
}

function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [baseline, setBaseline] = useState<Matrix>({});
  const [draft, setDraft] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [permQuery, setPermQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const { can: canManage, guard } = useGuard("users.manage");


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
    if (permsResult.error) toast.error(permsResult.error.message);
    if (rpResult.error) toast.error(rpResult.error.message);
    const perms = (permsResult.data ?? []) as Permission[];
    const rps = (rpResult.data ?? []) as RolePermission[];
    const m = buildMatrix(perms, rps);
    setProfiles((profilesResult.data ?? []) as Profile[]);
    setUserRoles((rolesResult.data ?? []) as UserRole[]);
    setPermissions(perms);
    setBaseline(m);
    setDraft(cloneMatrix(m));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const { toAdd, toRemove } = useMemo(() => diffMatrix(baseline, draft), [baseline, draft]);
  const dirty = toAdd.length + toRemove.length > 0;

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    for (const role of roles) {
      const count = permissions.filter((p) => draft[p.id]?.has(role)).length;
      if (role === "super_admin" && permissions.length > 0 && count < permissions.length) {
        errs.push("Super admin must retain all permissions.");
      }
      if (role !== "sales_viewer" && role !== "super_admin" && count === 0 && permissions.length > 0) {
        errs.push(`Role "${role.replaceAll("_", " ")}" has no permissions — users with this role will be locked out of the admin.`);
      }
    }
    return Array.from(new Set(errs));
  }, [draft, permissions]);

  function toggle(permId: string, role: Role, checked: boolean) {
    setDraft((prev) => {
      const next = cloneMatrix(prev);
      const set = next[permId] ?? new Set<Role>();
      if (checked) set.add(role); else set.delete(role);
      next[permId] = set;
      return next;
    });
  }

  function reset() {
    setDraft(cloneMatrix(baseline));
  }

  async function save() {
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    setSaving(true);
    try {
      for (const item of toRemove) {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", item.role)
          .eq("permission_id", item.permission_id);
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const { error } = await supabase.from("role_permissions").insert(toAdd);
        if (error) throw error;
      }
      toast.success(`Saved · +${toAdd.length} / −${toRemove.length}`);
      void logAdminAudit({
        action: "SENSITIVE_CHANGE",
        resource: "role_permissions",
        details: {
          summary: "Permission matrix updated",
          added: toAdd,
          removed: toRemove,
        },
      });
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save permissions";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((profile) => [profile.full_name, profile.email].some((value) => String(value ?? "").toLowerCase().includes(normalized)));
  }, [profiles, query]);

  const filteredPerms = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) => [p.key, p.label, p.description].some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [permissions, permQuery]);

  const groupedPerms = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of filteredPerms) {
      const page = p.key.includes(".") ? p.key.split(".")[0] : "other";
      const list = groups.get(page) ?? [];
      list.push(p);
      groups.set(page, list);
    }
    // Sort perms within a group by action (view→create→update→delete→other)
    const rank: Record<string, number> = { view: 0, create: 1, update: 2, delete: 3, manage: 4 };
    for (const [, list] of groups) {
      list.sort((a, b) => {
        const aa = a.key.split(".")[1] ?? "";
        const bb = b.key.split(".")[1] ?? "";
        return (rank[aa] ?? 9) - (rank[bb] ?? 9);
      });
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPerms]);

  function toggleGroup(role: Role, perms: Permission[], checked: boolean) {
    setDraft((prev) => {
      const next = cloneMatrix(prev);
      for (const p of perms) {
        const set = next[p.id] ?? new Set<Role>();
        if (checked) set.add(role); else set.delete(role);
        next[p.id] = set;
      }
      return next;
    });
  }


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
    const previousRole = existing[0]?.role ?? null;
    void logAdminAudit({
      action: "SENSITIVE_CHANGE",
      resource: "user_roles",
      recordId: userId,
      details: {
        summary: "User role changed",
        user_id: userId,
        from: previousRole,
        to: role,
      },
    });
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
              <p className="mt-1 text-sm text-muted-foreground">Toggle permissions per role, then save. Only super admins can persist changes — enforced at the database level via RLS.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-foreground">Role permissions matrix</h2>
              <span className="text-xs text-muted-foreground">{permissions.length} permissions × {roles.length} roles</span>
              {dirty && <Badge variant="secondary" className="text-xs">Unsaved · +{toAdd.length} / −{toRemove.length}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={permQuery} onChange={(e) => setPermQuery(e.target.value)} placeholder="Filter permissions…" className="h-8 w-56 pl-8 text-xs" />
              </div>
              <Button variant="outline" size="sm" onClick={guard(reset)} disabled={!canManage || !dirty || saving}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
              <Button size="sm" onClick={guard(save)} disabled={!canManage || !dirty || saving || validationErrors.length > 0}>
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save changes
              </Button>

            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="border-b border-destructive/30 bg-destructive/5 px-5 py-3">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <ul className="space-y-0.5">
                  {validationErrors.map((err) => <li key={err}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Permission</th>
                  {roles.map((r) => <th key={r} className="px-3 py-2 text-center capitalize">{r.replaceAll("_", " ")}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={roles.length + 1} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></td></tr>
                ) : filteredPerms.length === 0 ? (
                  <tr><td colSpan={roles.length + 1} className="px-4 py-10 text-center text-muted-foreground">No permissions match.</td></tr>
                ) : groupedPerms.map(([page, perms]) => (
                  <>
                    <tr key={`grp-${page}`} className="bg-secondary/30">
                      <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {page.replaceAll("-", " ")} <span className="ms-1 text-[10px] normal-case text-muted-foreground/70">({perms.length})</span>
                      </td>
                      {roles.map((r) => {
                        const all = perms.every((p) => draft[p.id]?.has(r));
                        const some = perms.some((p) => draft[p.id]?.has(r));
                        const disabled = r === "super_admin";
                        return (
                          <td key={r} className="px-3 py-2 text-center">
                            <Checkbox
                              checked={disabled ? true : all ? true : some ? "indeterminate" : false}
                              disabled={disabled || saving || !canManage}
                              onCheckedChange={guard((v: boolean | "indeterminate") => toggleGroup(r, perms, Boolean(v) && v !== "indeterminate"))}
                              aria-label={`Toggle all ${page} for ${r}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {perms.map((p) => {
                      const action = p.key.includes(".") ? p.key.split(".")[1] : "";
                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-2 ps-8">
                            <p className="font-medium text-foreground">
                              {action ? <span className="capitalize">{action}</span> : p.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <code className="rounded bg-secondary/60 px-1 py-0.5 text-[10px]">{p.key}</code>
                              {p.description ? <span className="ml-2">{p.description}</span> : null}
                            </p>
                          </td>
                          {roles.map((r) => {
                            const checked = draft[p.id]?.has(r) ?? false;
                            const wasChecked = baseline[p.id]?.has(r) ?? false;
                            const changed = checked !== wasChecked;
                            const disabled = r === "super_admin";
                            return (
                              <td key={r} className={`px-3 py-2 text-center ${changed ? "bg-primary/5" : ""}`}>
                                <Checkbox
                                  checked={disabled ? true : checked}
                                  disabled={disabled || saving || !canManage}
                                  onCheckedChange={guard((v: boolean | "indeterminate") => toggle(p.id, r, Boolean(v)))}
                                  aria-label={`${p.key} for ${r}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
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
                    <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{currentRole.replaceAll("_", " ")}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Select value={currentRole} onValueChange={guard((value: string) => setRole(profile.id, value as Role))} disabled={savingId === profile.id || !canManage}>
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>{roles.map((role) => <SelectItem key={role} value={role} className="capitalize">{role.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
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
