import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Clock } from "lucide-react";

type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
  changes: { old?: Record<string, unknown>; new?: Record<string, unknown>; diff?: Record<string, unknown> } | null;
};

const HIDDEN_KEYS = new Set(["updated_at", "created_at", "id"]);

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function ActionIcon({ action }: { action: string }) {
  if (action === "INSERT") return <Plus className="h-3.5 w-3.5" />;
  if (action === "DELETE") return <Trash2 className="h-3.5 w-3.5" />;
  return <Pencil className="h-3.5 w-3.5" />;
}

export function LeadTimeline({ leadId }: { leadId: string }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase
      .from("audit_logs")
      .select("id, action, actor_email, created_at, changes")
      .eq("table_name", "leads")
      .eq("record_id", leadId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!alive) return;
        setRows((data ?? []) as AuditRow[]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [leadId]);

  if (loading) {
    return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading activity…</div>;
  }

  if (rows.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No activity recorded yet. Future changes will appear here.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {rows.map((r) => {
        const diff = r.changes?.diff ?? {};
        const oldV = r.changes?.old ?? {};
        const changedKeys = Object.keys(diff).filter((k) => !HIDDEN_KEYS.has(k));
        const label = r.action === "INSERT" ? "Lead created" : r.action === "DELETE" ? "Lead deleted" : "Lead updated";
        return (
          <li key={r.id} className="relative">
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
              <ActionIcon action={r.action} />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">by {r.actor_email ?? "system"}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            {r.action === "UPDATE" && changedKeys.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-md border border-border/60 bg-muted/30 p-2 text-xs">
                {changedKeys.map((k) => (
                  <li key={k} className="grid grid-cols-[minmax(0,120px)_1fr] gap-2">
                    <span className="truncate font-medium text-muted-foreground">{k}</span>
                    <span className="min-w-0">
                      <span className="text-muted-foreground line-through">{formatValue(oldV[k])}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="text-foreground">{formatValue((diff as Record<string, unknown>)[k])}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
