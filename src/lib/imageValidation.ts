export type ImageValidationOptions = {
  maxBytes?: number;         // default 3MB
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedTypes?: string[];   // e.g. ["image/jpeg","image/png","image/webp","image/svg+xml"]
  /** Expected aspect ratio (width / height). When set the image must match within `aspectTolerance`. */
  expectedAspect?: number;
  /** Fractional tolerance around expectedAspect. Default 0.08 (≈ ±8%). */
  aspectTolerance?: number;
};


export type ImageValidationResult =
  | { ok: true; width: number; height: number; bytes?: number; type?: string }
  | { ok: false; error: string };

const DEFAULTS: Required<Pick<ImageValidationOptions, "maxBytes" | "allowedTypes" | "minWidth" | "minHeight" | "maxWidth" | "maxHeight">> = {
  maxBytes: 3 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif"],
  minWidth: 320,
  minHeight: 240,
  maxWidth: 6000,
  maxHeight: 6000,
};

function loadDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

/** Validate a File before upload. */
export async function validateImageFile(file: File, options: ImageValidationOptions = {}): Promise<ImageValidationResult> {
  const opts = { ...DEFAULTS, ...options };
  if (!opts.allowedTypes.includes(file.type)) {
    return { ok: false, error: `Unsupported file type "${file.type || "unknown"}". Allowed: ${opts.allowedTypes.join(", ")}` };
  }
  if (file.size > opts.maxBytes) {
    return { ok: false, error: `File is ${(file.size / 1024 / 1024).toFixed(2)}MB — max ${(opts.maxBytes / 1024 / 1024).toFixed(1)}MB` };
  }
  const url = URL.createObjectURL(file);
  try {
    const { width, height } = await loadDimensions(url);
    if (width < opts.minWidth || height < opts.minHeight) {
      return { ok: false, error: `Image is ${width}×${height}, minimum ${opts.minWidth}×${opts.minHeight}` };
    }
    if (width > opts.maxWidth || height > opts.maxHeight) {
      return { ok: false, error: `Image is ${width}×${height}, maximum ${opts.maxWidth}×${opts.maxHeight}` };
    }
    return { ok: true, width, height, bytes: file.size, type: file.type };
  } catch {
    return { ok: false, error: "Could not decode image" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Validate a remote URL by loading dimensions in the browser. */
export async function validateImageUrl(url: string, options: ImageValidationOptions = {}): Promise<ImageValidationResult> {
  const opts = { ...DEFAULTS, ...options };
  try {
    // Basic URL check
    new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  try {
    const { width, height } = await loadDimensions(url);
    if (width < opts.minWidth || height < opts.minHeight) {
      return { ok: false, error: `Image is ${width}×${height}, minimum ${opts.minWidth}×${opts.minHeight}` };
    }
    if (width > opts.maxWidth || height > opts.maxHeight) {
      return { ok: false, error: `Image is ${width}×${height}, maximum ${opts.maxWidth}×${opts.maxHeight}` };
    }
    if (options.expectedAspect) {
      const tol = options.aspectTolerance ?? 0.08;
      const actual = width / height;
      const diff = Math.abs(actual - options.expectedAspect) / options.expectedAspect;
      if (diff > tol) {
        return {
          ok: false,
          error: `Aspect ratio ${actual.toFixed(2)}:1 is outside the allowed range (${options.expectedAspect.toFixed(2)}:1 ±${Math.round(tol * 100)}%). Crop before uploading.`,
        };
      }
    }
    return { ok: true, width, height };
  } catch {
    return { ok: false, error: "Image failed to load from URL" };
  }
}

