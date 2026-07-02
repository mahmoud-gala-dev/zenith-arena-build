import { cn } from "@/lib/utils";
import logoAsset from "@/assets/apex-logo.svg.asset.json";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {light ? (
        <img
          src={logoAsset.url}
          alt="APEX Sports"
          className="h-16 w-auto brightness-0 invert"
        />
      ) : (
        <>
          <img
            src={logoAsset.url}
            alt="APEX Sports"
            className="h-16 w-auto block dark:hidden"
          />
          <img
            src={logoAsset.url}
            alt="APEX Sports"
            className="h-16 w-auto hidden dark:block brightness-0 invert"
          />
        </>
      )}
    </span>
  );
}
