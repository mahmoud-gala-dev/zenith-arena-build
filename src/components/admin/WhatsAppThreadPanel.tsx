import { useState } from "react";
import { MessageCircle, Send, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { appendWhatsAppMessage } from "@/lib/leads.functions";

type ThreadEntry = {
  at: string;
  direction: "incoming" | "outgoing";
  channel?: string;
  body: string;
  actor_email?: string | null;
  via?: string;
  source?: string;
};

type Props = {
  leadId: string;
  phone: string | null;
  thread: ThreadEntry[] | null | undefined;
  canManage: boolean;
  onAppended: (entry: ThreadEntry) => void;
};

export function WhatsAppThreadPanel({ leadId, phone, thread, canManage, onAppended }: Props) {
  const [body, setBody] = useState("");
  const [direction, setDirection] = useState<"outgoing" | "incoming">("outgoing");
  const [saving, setSaving] = useState(false);
  const append = useServerFn(appendWhatsAppMessage);

  const items = Array.isArray(thread) ? thread : [];
  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  const waHref = digits ? `https://wa.me/${digits}` : null;

  async function submit() {
    const text = body.trim();
    if (!text) return toast.error("Message is empty");
    setSaving(true);
    try {
      const res = await append({ data: { leadId, direction, body: text } });
      onAppended(res.entry as ThreadEntry);
      setBody("");
      toast.success("Logged");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          WhatsApp Thread ({items.length})
        </div>
        {waHref && (
          <a href={waHref} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 hover:underline dark:text-emerald-300">
            Open in WhatsApp →
          </a>
        )}
      </div>

      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No WhatsApp activity yet.</p>
        ) : (
          items.map((m, i) => {
            const outgoing = m.direction === "outgoing";
            return (
              <div
                key={i}
                className={`rounded-lg border p-2 text-xs ${
                  outgoing
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {outgoing ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                    {m.direction} {m.via ? `· ${m.via}` : ""} {m.actor_email ? `· ${m.actor_email}` : ""}
                  </span>
                  <span>{new Date(m.at).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-foreground">{m.body || <em className="text-muted-foreground">(no body)</em>}</p>
              </div>
            );
          })
        )}
      </div>

      {canManage && (
        <div className="space-y-2 border-t border-border pt-2">
          <div className="flex gap-2">
            <Select value={direction} onValueChange={(v) => setDirection(v as "outgoing" | "incoming")}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">Incoming reply</SelectItem>
                <SelectItem value="outgoing">Outgoing message</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={submit} disabled={saving || !body.trim()}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              <span className="ml-1">Log</span>
            </Button>
          </div>
          <Textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste the WhatsApp reply or note the message you sent…"
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
