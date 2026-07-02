import { useState } from "react";
import { Facebook, Linkedin, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

interface ShareButtonsProps {
  title: string;
  path?: string;
  /** Optional short summary used in WhatsApp / X share text. */
  summary?: string;
}

export function ShareButtons({ title, path, summary }: ShareButtonsProps) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const ar = lang === "ar";

  // Recompute URL at click time so the shared link always matches what the
  // visitor is actually looking at (including query strings and future
  // language segments). Fall back to the provided path for SSR safety.
  const currentUrl = () => {
    if (typeof window !== "undefined") return window.location.href;
    return path ?? "/";
  };

  const waMessage = (url: string) => {
    if (ar) {
      const intro = summary ? `${title} — ${summary}` : title;
      return `${intro}\nاطلع على التفاصيل عبر Egytic:\n${url}`;
    }
    const intro = summary ? `${title} — ${summary}` : title;
    return `${intro}\nRead more on Egytic:\n${url}`;
  };

  const open = (href: string) => {
    if (typeof window === "undefined") return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const shares = [
    {
      name: "Facebook",
      Icon: Facebook,
      onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl())}`),
    },
    {
      name: "X",
      Icon: Twitter,
      onClick: () => {
        const url = currentUrl();
        const text = summary ? `${title} — ${summary}` : title;
        open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      },
    },
    {
      name: "LinkedIn",
      Icon: Linkedin,
      onClick: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl())}`),
    },
    {
      name: "WhatsApp",
      Icon: MessageCircle,
      onClick: () => open(`https://wa.me/?text=${encodeURIComponent(waMessage(currentUrl()))}`),
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {ar ? "مشاركة" : "Share"}
      </span>
      {shares.map(({ name, Icon, onClick }) => (
        <button
          key={name}
          type="button"
          onClick={onClick}
          aria-label={ar ? `مشاركة على ${name}` : `Share on ${name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <button
        type="button"
        onClick={onCopy}
        aria-label={ar ? "نسخ الرابط" : "Copy link"}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ الرابط" : "Copy link")}
      </button>
    </div>
  );
}
