/**
 * Build a WhatsApp deep link with a pre-filled message that includes the
 * project/brand name, the requested service (or current page context) and
 * the visitor's phone / a call-back number.
 */
export type WhatsAppMessageContext = {
  brand?: string;
  service?: string | null;
  pageUrl?: string | null;
  phone?: string | null;
  ar?: boolean;
  extra?: string | null;
};

export function buildWhatsAppMessage(ctx: WhatsAppMessageContext): string {
  const ar = !!ctx.ar;
  const lines: string[] = [];
  if (ar) {
    lines.push(`مرحبًا${ctx.brand ? ` ${ctx.brand}` : ""}،`);
    if (ctx.service) lines.push(`مهتم بـ: ${ctx.service}`);
    if (ctx.pageUrl) lines.push(`الصفحة: ${ctx.pageUrl}`);
    if (ctx.phone) lines.push(`رقم للتواصل: ${ctx.phone}`);
    if (ctx.extra) lines.push(ctx.extra);
  } else {
    lines.push(`Hi${ctx.brand ? ` ${ctx.brand}` : ""},`);
    if (ctx.service) lines.push(`I'm interested in: ${ctx.service}`);
    if (ctx.pageUrl) lines.push(`Page: ${ctx.pageUrl}`);
    if (ctx.phone) lines.push(`My phone: ${ctx.phone}`);
    if (ctx.extra) lines.push(ctx.extra);
  }
  return lines.join("\n");
}

export function buildWhatsAppUrl(number: string, ctx: WhatsAppMessageContext = {}): string {
  const digits = number.replace(/[^0-9]/g, "");
  const text = buildWhatsAppMessage(ctx);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Best-effort inference of the current page's "service / topic" from the URL,
 * used when the caller doesn't pass one explicitly (e.g. site-wide header).
 */
export function inferServiceFromPath(pathname: string, ar = false): string | null {
  const seg = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
  if (!seg.length) return ar ? "الصفحة الرئيسية" : "Home";
  const map: Record<string, [string, string]> = {
    services: ["الخدمات", "Services"],
    projects: ["المشاريع", "Projects"],
    products: ["المنتجات", "Products"],
    gallery: ["معرض الصور", "Gallery"],
    knowledge: ["مركز المعرفة", "Knowledge"],
    about: ["من نحن", "About"],
    contact: ["تواصل معنا", "Contact"],
    downloads: ["التحميلات", "Downloads"],
    governorates: ["المحافظات", "Governorates"],
  };
  const base = map[seg[0]];
  const detail = seg[1] ? decodeURIComponent(seg[1]).replace(/[-_]+/g, " ") : null;
  const label = base ? (ar ? base[0] : base[1]) : seg[0];
  return detail ? `${label} — ${detail}` : label;
}
