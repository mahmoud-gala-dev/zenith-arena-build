import { cn } from "@/lib/utils";
import logoAsset from "@/assets/apex-logo.svg.asset.json";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={logoAsset.url}
        alt="APEX Sports"
        className={cn("h-10 w-auto", light && "brightness-0 invert")}
      />
    </span>
  );
}
