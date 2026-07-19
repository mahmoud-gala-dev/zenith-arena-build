import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  error: Error;
  reset?: () => void;
  boundary?: string;
}

function detectLang(): "ar" | "en" {
  if (typeof document !== "undefined") {
    const l = document.documentElement.getAttribute("lang");
    if (l === "ar") return "ar";
  }
  return "en";
}

export function GlobalErrorFallback({ error, reset, boundary = "global" }: Props) {
  const router = useRouter();
  const ar = detectLang() === "ar";

  useEffect(() => {
    console.error(`[${boundary}]`, error);
    reportLovableError(error, { boundary });
  }, [error, boundary]);

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {ar ? "حدث خطأ غير متوقع" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {ar
            ? "نأسف على هذا الخلل. يمكنك المحاولة مجددًا أو العودة إلى الصفحة الرئيسية."
            : "We're sorry for the inconvenience. You can try again or head back home."}
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ar ? "حاول مرة أخرى" : "Try again"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {ar ? "العودة للرئيسية" : "Go home"}
          </a>
        </div>
      </div>
    </div>
  );
}
