import { cn } from "@/lib/utils";
import logoAsset from "@/assets/apex-logo.svg.asset.json";
import { useBranding } from "@/hooks/useBranding";

/**
 * Site logo. Pulls custom light/dark logos from the `branding` settings row
 * when present; falls back to the bundled monogram SVG otherwise.
 * The `light` prop forces the white variant (used on dark surfaces like the footer).
 */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  const { data } = useBranding();
  const customLight = data?.logo_light_url?.trim();
  const customDark = data?.logo_dark_url?.trim();

  const fallback = logoAsset.url;
  const lightSrc = customLight || fallback;
  const darkSrc = customDark || fallback;

  // Responsive height: mobile 48px, tablet 60px, desktop 72px. Retina-crisp SVG.
  const sizing = "h-16 sm:h-20 lg:h-24 xl:h-28 w-auto max-w-[320px] object-contain select-none";


  if (light) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img
          src={lightSrc}
          alt="APEX Sports"
          className={cn(sizing, !customLight && "brightness-0 invert")}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* Light theme */}
      <img
        src={darkSrc}
        alt="APEX Sports"
        className={cn(sizing, "block dark:hidden")}
        draggable={false}
      />
      {/* Dark theme */}
      <img
        src={lightSrc}
        alt="APEX Sports"
        className={cn(sizing, "hidden dark:block", !customLight && "brightness-0 invert")}
        draggable={false}
      />
    </span>
  );
}
