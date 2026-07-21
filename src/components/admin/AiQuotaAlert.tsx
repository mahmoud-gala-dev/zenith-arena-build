import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Gauge } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ai_quota_alert_shown_v1";

type Alerted = { day: string; t80: boolean; t95: boolean; t100: boolean };

function loadAlerted(day: string): Alerted {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Alerted;
      if (parsed.day === day) return parsed;
    }
  } catch {}
  return { day, t80: false, t95: false, t100: false };
}

function saveAlerted(a: Alerted) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(a)); } catch {}
}

export function AiQuotaAlert() {
  const [used, setUsed] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  async function refresh() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const { data: s } = await supabase
      .from("ai_settings")
      .select("daily_user_limit, enabled")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const dailyLimit = s?.daily_user_limit ?? 200;
    if (!s?.enabled) {
      setLimit(dailyLimit);
      setUsed(0);
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .gte("created_at", startOfDay.toISOString());

    setLimit(dailyLimit);
    setUsed(count ?? 0);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (used == null || !limit) return;
    const pct = (used / limit) * 100;
    const day = new Date().toISOString().slice(0, 10);
    const state = loadAlerted(day);
    const link = "/admin/ai";

    if (pct >= 100 && !state.t100) {
      toast.error("AI daily quota reached · تم استنفاد الحصة اليومية", {
        description: `${used}/${limit} — رفع الحد من إعدادات AI`,
        action: { label: "Open settings", onClick: () => { window.location.href = link; } },
        duration: 10000,
      });
      state.t100 = true; state.t95 = true; state.t80 = true;
      saveAlerted(state);
    } else if (pct >= 95 && !state.t95) {
      toast.warning("95% من حصة AI اليومية · 95% of daily AI quota", {
        description: `${used}/${limit} — قريب من الحد الأقصى`,
        action: { label: "Adjust limit", onClick: () => { window.location.href = link; } },
        duration: 8000,
      });
      state.t95 = true; state.t80 = true;
      saveAlerted(state);
    } else if (pct >= 80 && !state.t80) {
      toast("80% من حصة AI اليومية · 80% of daily AI quota", {
        description: `${used}/${limit} — راجع الاستهلاك`,
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        action: { label: "Open settings", onClick: () => { window.location.href = link; } },
        duration: 6000,
      });
      state.t80 = true;
      saveAlerted(state);
    }
  }, [used, limit]);

  if (used == null || !limit) return null;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  if (pct < 80) return null;

  const tone =
    pct >= 100
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : pct >= 95
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
      : "bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20";

  return (
    <Link
      to="/admin/ai"
      title="AI daily quota · حصة AI اليومية"
      className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-90 ${tone}`}
    >
      <Gauge className="h-3.5 w-3.5" />
      AI {pct}% · {used}/{limit}
    </Link>
  );
}
