import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles, Trash2, User, Bot } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { aiAdminChat } from "@/lib/ai/chat.functions";

function useAdminLanguage(): "en" | "ar" {
  const [lang, setLang] = useState<"en" | "ar">("en");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) || document.documentElement.lang || "en";
    setLang(stored === "ar" ? "ar" : "en");
  }, []);
  return lang;
}

type Msg = { role: "user" | "assistant"; content: string; ts: number };

const STORAGE_KEY = "egytic:admin-assistant:messages";
const MAX_MESSAGES = 40;

const SUGGESTIONS_EN = [
  "How many new leads today?",
  "Summarize this week's activity",
  "Draft a WhatsApp reply for the last lead",
  "List services missing SEO descriptions",
];
const SUGGESTIONS_AR = [
  "كم عدد الـleads اليوم؟",
  "لخّص نشاط هذا الأسبوع",
  "اكتب رد واتساب لآخر lead",
  "اذكر الخدمات التي ينقصها وصف SEO",
];

export const Route = createFileRoute("/_authenticated/admin/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  const language = useAdminLanguage();
  const chat = useServerFn(aiAdminChat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [busy]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content, ts: Date.now() }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await chat({
        data: {
          messages: next.slice(-MAX_MESSAGES).map((m) => ({ role: m.role, content: m.content })),
          language,
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.text, ts: Date.now() }]);
    } catch (e: any) {
      toast.error(e?.message ?? "AI request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${e?.message ?? "Error"}`, ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const suggestions = language === "ar" ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <AdminShell title={language === "ar" ? "المساعد الذكي" : "AI Assistant"}>
      <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-primary p-2 text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{language === "ar" ? "مساعد إدارة Egytic" : "Egytic Admin Assistant"}</div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "يعرف بيانات موقعك الحيّة ويجيب باللغة العربية" : "Knows your live site data · answers in English"}
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="h-4 w-4" /> {language === "ar" ? "مسح" : "Clear"}
            </Button>
          )}
        </div>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-soft">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-primary/10 p-6"><Sparkles className="h-10 w-10 text-primary" /></div>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "اسأل عن أي شيء يخص موقعك أو بياناتك." : "Ask me anything about your site or data."}
              </p>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border border-border bg-secondary/40 p-3 text-start text-sm transition hover:bg-secondary hover:shadow-sm"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="mt-1 h-8 w-8 flex-none rounded-full bg-primary/10 p-1.5 text-primary"><Bot className="h-full w-full" /></div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-foreground"
                  }`}
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="mt-1 h-8 w-8 flex-none rounded-full bg-secondary p-1.5"><User className="h-full w-full" /></div>
                )}
              </div>
            ))
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === "ar" ? "يفكّر…" : "Thinking…"}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2 rounded-xl border border-border bg-card p-3 shadow-soft"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={language === "ar" ? "اكتب سؤالك…" : "Ask anything…"}
            dir={language === "ar" ? "rtl" : "ltr"}
            rows={2}
            className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()} size="icon" className="self-end">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </AdminShell>
  );
}
