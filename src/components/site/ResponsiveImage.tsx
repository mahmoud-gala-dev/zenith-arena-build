import { useSignedImage, useVariantSrcSet, type ImageVariantsManifest } from "@/hooks/useSignedImage";

type Props = {
  src: string | null | undefined;
  variants?: ImageVariantsManifest | null;
  alt: string;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * Renders a responsive <picture> from a variants manifest when present, otherwise
 * falls back to the original URL — with automatic signed-URL refresh.
 */
export function ResponsiveImage({
  src,
  variants,
  alt,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  width,
  height,
  loading = "lazy",
  fetchPriority = "auto",
  onError,
}: Props) {
  const fallback = useSignedImage(src ?? null);
  const variantSet = useVariantSrcSet(variants ?? null);

  if (!fallback && !variantSet?.src) return null;

  if (variantSet && variantSet.srcSet) {
    return (
      <picture>
        <source type="image/webp" srcSet={variantSet.srcSet} sizes={sizes} />
        <img
          src={variantSet.src || fallback || ""}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          className={className}
          onError={onError}
        />
      </picture>
    );
  }

  return (
    <img
      src={fallback ?? ""}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
      onError={onError}
    />
  );
}
