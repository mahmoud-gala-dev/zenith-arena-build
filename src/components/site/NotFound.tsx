import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

type BackKey =
  | "backHome"
  | "backToProjects"
  | "backToProducts"
  | "backToKnowledge"
  | "backToDownloads"
  | "backToServices";

interface NotFoundProps {
  backTo?: string;
  backKey?: BackKey;
  withLayout?: boolean;
  showCode?: boolean;
}

export function NotFound({
  backTo = "/",
  backKey = "backHome",
  withLayout = true,
  showCode = false,
}: NotFoundProps) {
  const { t } = useLang();
  const body = (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      {showCode ? <h1 className="text-7xl font-bold text-foreground">404</h1> : null}
      <p className="text-2xl font-semibold text-foreground">{t.common.notFoundTitle}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t.common.notFoundBody}</p>
      <Button asChild variant="hero" className="mt-2">
        <Link to={backTo}>{t.common[backKey]}</Link>
      </Button>
    </div>
  );
  if (!withLayout) return body;
  return <SiteLayout>{body}</SiteLayout>;
}
