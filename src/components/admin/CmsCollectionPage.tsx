import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Loader2, Filter, ArrowUpDown, ExternalLink } from "lucide-react";
import { TableRowsSkeleton } from "@/components/site/Skeletons";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TableName = keyof Database["public"]["Tables"];
type AnyRow = Record<string, unknown> & { id?: string; status?: string; featured?: boolean; updated_at?: string; created_at?: string };
type FieldType = "text" | "textarea" | "number" | "switch" | "select" | "date" | "url" | "json" | "tags";

export type CmsField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  dir?: "ltr" | "rtl";
  maxLength?: number;
  fullWidth?: boolean;
};

export type CmsColumn = {
  key: string;
  label: string;
  type?: "text" | "badge" | "date" | "boolean" | "image";
};

export type CmsCollectionConfig = {
  table: TableName;
  title: string;
  description: string;
  singular: string;
  columns: CmsColumn[];
  fields: CmsField[];
  initialValues: AnyRow;
  searchFields: string[];
  orderBy?: string;
  orderAscending?: boolean;
  filters?: Array<{ key: string; label: string; values: string[] }>;
  preparePayload?: (values: AnyRow) => AnyRow;
  previewUrl?: (row: AnyRow) => string | null;
};

const contentStatuses = ["published", "draft", "archived"];
const textValueSchema = z.string().trim().max(5000);
const urlSchema = z.union([z.literal(""), z.string().trim().url()]);

export function CmsCollectionPage({ config }: { config: CmsCollectionConfig }) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterKey, setFilterKey] = useState("status");
  const [filterValue, setFilterValue] = useState("all");
  const [sortKey, setSortKey] = useState(config.orderBy ?? "updated_at");
  const [sortAsc, setSortAsc] = useState(config.orderAscending ?? false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from(config.table as never)
      .select("*")
      .order(sortKey, { ascending: sortAsc });

    if (loadError) {
      setError(loadError.message);
      toast.error(loadError.message);
    } else {
      setRows((data ?? []) as AnyRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table, sortKey, sortAsc]);

  const activeFilter = config.filters?.find((f) => f.key === filterKey);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterValue !== "all" && String(row[filterKey] ?? "") !== filterValue) return false;
      if (!normalized) return true;
      return config.searchFields.some((field) => String(row[field] ?? "").toLowerCase().includes(normalized));
    });
  }, [rows, query, config.searchFields, filterKey, filterValue]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, filterValue]);

  function beginCreate() {
    setEditing({ ...config.initialValues });
  }

  function validate(values: AnyRow) {
    for (const field of config.fields) {
      const raw = values[field.name];
      const text = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw);
      if (field.required && !text) return `${field.label} is required`;
      if ((field.type === "text" || field.type === "textarea" || field.type === "tags") && !textValueSchema.max(field.maxLength ?? 5000).safeParse(text).success) {
        return `${field.label} is too long`;
      }
      if ((field.type === "url" || field.name.includes("image")) && text && !urlSchema.safeParse(text).success) {
        return `${field.label} must be a valid URL`;
      }
      if (field.type === "json" && text) {
        try {
          JSON.parse(text);
        } catch {
          return `${field.label} must be valid JSON`;
        }
      }
    }
    return null;
  }

  function normalize(values: AnyRow) {
    const payload: AnyRow = {};
    config.fields.forEach((field) => {
      const value = values[field.name];
      if (field.type === "number") payload[field.name] = value === "" || value == null ? null : Number(value);
      else if (field.type === "switch") payload[field.name] = Boolean(value);
      else if (field.type === "json") payload[field.name] = value ? JSON.parse(String(value)) : {};
      else if (field.type === "tags") payload[field.name] = String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      else payload[field.name] = typeof value === "string" && value.trim() === "" ? null : value;
    });
    return config.preparePayload ? config.preparePayload(payload) : payload;
  }

  async function save() {
    if (!editing) return;
    const validationError = validate(editing);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const payload = normalize(editing);
    const id = editing.id;
    const { error: saveError } = id
      ? await supabase.from(config.table as never).update(payload as never).eq("id", id)
      : await supabase.from(config.table as never).insert(payload as never);

    setSaving(false);
    if (saveError) {
      toast.error(saveError.message);
      return;
    }

    toast.success(`${config.singular} saved`);

    // Auto-refresh social cache for Knowledge articles.
    if (config.table === "blog_posts" && typeof window !== "undefined") {
      const slug = (payload as AnyRow).slug_en as string | undefined;
      const status = (payload as AnyRow).status as string | undefined;
      if (slug && status === "published") {
        const url = `${window.location.origin}/knowledge/${slug}`;
        fetch(`https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true`, { method: "POST" })
          .then((r) => {
            if (r.ok) toast.success("Social preview cache refreshed", { description: url });
            else toast.message("Refresh cache manually", {
              description: "Open Admin → Social preview cache",
              action: { label: "Open", onClick: () => window.open("/admin/social-cache", "_self") },
            });
          })
          .catch(() => {
            toast.message("Refresh cache manually", {
              description: "Open Admin → Social preview cache",
              action: { label: "Open", onClick: () => window.open("/admin/social-cache", "_self") },
            });
          });
      }
    }

    setEditing(null);
    load();
  }


  async function confirmDelete() {
    if (!deleteIds?.length) return;
    const { error: deleteError } = await supabase.from(config.table as never).delete().in("id", deleteIds);
    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }
    toast.success(deleteIds.length > 1 ? "Items deleted" : `${config.singular} deleted`);
    setRows((prev) => prev.filter((row) => !deleteIds.includes(String(row.id))));
    setSelectedIds(new Set());
    setDeleteIds(null);
  }

  async function updateInline(row: AnyRow, key: string, value: unknown) {
    if (!row.id) return;
    const { error: updateError } = await supabase.from(config.table as never).update({ [key]: value } as never).eq("id", row.id);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, [key]: value } : item)));
    toast.success("Updated");
  }

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => row.id && selectedIds.has(row.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{rows.length} total</Badge>
            <Badge variant="outline">{filtered.length} visible</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteIds(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4" /> Delete {selectedIds.size}
            </Button>
          )}
          <Button onClick={beginCreate}>
            <Plus className="h-4 w-4" /> New {config.singular}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className="pl-9" />
        </div>
        {config.filters && config.filters.length > 0 && (
          <div className="flex gap-2">
            <Select value={filterKey} onValueChange={(value) => { setFilterKey(value); setFilterValue("all"); }}>
              <SelectTrigger className="w-36"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>{config.filters.map((filter) => <SelectItem key={filter.key} value={filter.key}>{filter.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(activeFilter?.values ?? []).map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <Select value={sortKey} onValueChange={setSortKey}>
          <SelectTrigger className="w-44"><ArrowUpDown className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            {[...config.columns, { key: "created_at", label: "Created" }, { key: "updated_at", label: "Updated" }]
              .filter((column, index, array) => array.findIndex((candidate) => candidate.key === column.key) === index)
              .map((column) => <SelectItem key={column.key} value={column.key}>{column.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSortAsc((prev) => !prev)}>{sortAsc ? "Ascending" : "Descending"}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    const next = new Set(selectedIds);
                    visibleRows.forEach((row) => {
                      if (!row.id) return;
                      if (checked) next.add(row.id);
                      else next.delete(row.id);
                    });
                    setSelectedIds(next);
                  }}
                  aria-label="Select visible rows"
                />
              </th>
              {config.columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableRowsSkeleton rows={6} columns={config.columns.length} />
            ) : error ? (
              <tr><td colSpan={config.columns.length + 2} className="px-4 py-16 text-center text-destructive">{error}</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td colSpan={config.columns.length + 2} className="px-4 py-16 text-center text-muted-foreground">No {config.title.toLowerCase()} found.</td></tr>
            ) : visibleRows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={!!row.id && selectedIds.has(row.id)}
                    onCheckedChange={(checked) => {
                      if (!row.id) return;
                      const next = new Set(selectedIds);
                      if (checked) next.add(row.id);
                      else next.delete(row.id);
                      setSelectedIds(next);
                    }}
                    aria-label="Select row"
                  />
                </td>
                {config.columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    <Cell row={row} column={column} onInlineUpdate={updateInline} />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {config.previewUrl && (() => {
                      const url = config.previewUrl(row);
                      return url ? (
                        <Button asChild variant="ghost" size="sm" aria-label={`Preview ${config.singular}`}>
                          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      ) : null;
                    })()}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(row)} aria-label={`Edit ${config.singular}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => row.id && setDeleteIds([row.id])} aria-label={`Delete ${config.singular}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}>Next</Button>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <FieldEditor key={field.name} field={field} values={editing} onChange={(value) => setEditing({ ...editing, [field.name]: value })} />
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteIds} onOpenChange={(open) => !open && setDeleteIds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteIds?.length === 1 ? config.singular : "items"}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The selected CMS content will be removed from the website.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Cell({ row, column, onInlineUpdate }: { row: AnyRow; column: CmsColumn; onInlineUpdate: (row: AnyRow, key: string, value: unknown) => void }) {
  const value = row[column.key];
  if (column.type === "image") {
    return value ? <img src={String(value)} alt="" className="h-12 w-16 rounded-md object-cover" loading="lazy" /> : <span className="text-muted-foreground">—</span>;
  }
  if (column.type === "date") return <span className="text-muted-foreground">{value ? new Date(String(value)).toLocaleDateString() : "—"}</span>;
  if (column.type === "boolean") {
    return <Switch checked={Boolean(value)} onCheckedChange={(checked) => onInlineUpdate(row, column.key, checked)} aria-label={column.label} />;
  }
  if (column.key === "status") {
    return (
      <Select value={String(value ?? "published")} onValueChange={(next) => onInlineUpdate(row, "status", next)}>
        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
        <SelectContent>{contentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (column.type === "badge") return <Badge variant="secondary">{String(value ?? "—")}</Badge>;
  return <span className={column.key.includes("title") || column.key.includes("name") ? "font-medium text-foreground" : "text-muted-foreground"}>{String(value ?? "—")}</span>;
}

function FieldEditor({ field, values, onChange }: { field: CmsField; values: AnyRow; onChange: (value: unknown) => void }) {
  const value = values[field.name];
  const wrapper = field.fullWidth || field.type === "textarea" || field.type === "json" ? "sm:col-span-2" : "";

  return (
    <div className={`space-y-1.5 ${wrapper}`}>
      <Label>{field.label}{field.required ? " *" : ""}</Label>
      {field.type === "textarea" ? (
        <Textarea rows={4} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} dir={field.dir} maxLength={field.maxLength} />
      ) : field.type === "json" ? (
        <Textarea rows={7} value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder ?? '{ "key": "value" }'} />
      ) : field.type === "switch" ? (
        <div className="flex h-10 items-center"><Switch checked={Boolean(value)} onCheckedChange={onChange} /></div>
      ) : field.type === "select" ? (
        <Select value={String(value ?? field.options?.[0]?.value ?? "")} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : (
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          dir={field.dir}
          maxLength={field.maxLength}
        />
      )}
    </div>
  );
}
