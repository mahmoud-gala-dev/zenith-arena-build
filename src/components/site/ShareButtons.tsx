import { useState } from "react";
import { Facebook, Linkedin, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

interface ShareButtonsProps {
  title: string;
  path: string;
}

export function ShareButtons({ title, path }: ShareButtonsProps) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const ar = lang === "ar";

  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shares = [
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, Icon: Facebook },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, Icon: Twitter },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, Icon: Linkedin },
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, Icon: MessageCircle },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
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
      {shares.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ar ? `مشاركة على ${name}` : `Share on ${name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
        >
          <Icon className="h-4 w-4" />
        </a>
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
