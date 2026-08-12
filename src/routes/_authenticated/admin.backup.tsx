import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Database, Download, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  exportDatabaseSql,
  importDatabaseSql,
  listBackupTables,
} from "@/lib/backup.functions";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: isSuper } = await supabase.rpc("has_role", {
      _user_id: uid,
      _role: "super_admin",
    });
    if (!isSuper) throw redirect({ to: "/admin" });
  },
  component: BackupPage,
});

function BackupPage() {
  const listTables = useServerFn(listBackupTables);
  const doExport = useServerFn(exportDatabaseSql);
  const doImport = useServerFn(importDatabaseSql);

  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listTables({ data: {} } as never)
      .then((r: { tables: string[] }) => {
        setTables(r.tables);
        setSelected(new Set(r.tables));
      })
      .catch((e: Error) => toast.error(e.message));
  }, [listTables]);

  const toggle = (t: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  async function handleExport() {
    setExporting(true);
    try {
      const res = (await doExport({
        data: { tables: Array.from(selected) },
      } as never)) as { sql: string; counts: Record<string, number> };
      setCounts(res.counts);
      const blob = new Blob([res.sql], { type: "application/sql;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `egytic-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم إنشاء النسخة الاحتياطية — Backup downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    if (
      !window.confirm(
        "سيتم استبدال البيانات الحالية بالكامل بمحتوى الملف. هل تريد المتابعة؟\nThis replaces current data with the file contents. Continue?",
      )
    )
      return;
    setImporting(true);
    try {
      const sql = await file.text();
      await doImport({ data: { sql } } as never);
      toast.success("تمت استعادة قاعدة البيانات — Restore complete");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <AdminShell title="Backup & Restore — النسخ الاحتياطي والاستعادة">
      <div className="space-y-8 max-w-4xl">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>
            الاستعادة تحذف البيانات الحالية للجداول الموجودة في الملف وتستبدلها. احتفظ بنسخة قبل
            الاستعادة. متاح لحساب المدير الأعلى فقط.
            <br />
            Restore truncates and replaces data for every table in the file. Export first.
          </p>
        </div>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Download className="h-5 w-5" /> تصدير SQL كامل — Full SQL export
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set(tables))}>
              تحديد الكل
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              إلغاء التحديد
            </Button>
            <span className="text-muted-foreground">
              {selected.size}/{tables.length} جدول
            </span>
          </div>
          <div className="grid gap-1 sm:grid-cols-3 max-h-72 overflow-auto rounded border p-3">
            {tables.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.has(t)} onChange={() => toggle(t)} />
                <span className="truncate">{t}</span>
                {counts?.[t] !== undefined && (
                  <span className="text-xs text-muted-foreground">({counts[t]})</span>
                )}
              </label>
            ))}
            {tables.length === 0 && (
              <span className="text-sm text-muted-foreground">جارٍ التحميل…</span>
            )}
          </div>
          <Button onClick={handleExport} disabled={exporting || selected.size === 0}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            تنزيل ملف SQL
          </Button>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Upload className="h-5 w-5" /> استيراد / استعادة — Import & restore
          </h2>
          <div className="space-y-2">
            <Label htmlFor="sqlfile">ملف SQL (.sql)</Label>
            <input
              id="sqlfile"
              ref={fileRef}
              type="file"
              accept=".sql,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          <Button variant="destructive" onClick={handleImport} disabled={!file || importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            تنفيذ الاستعادة
          </Button>
        </section>
      </div>
    </AdminShell>
  );
}
