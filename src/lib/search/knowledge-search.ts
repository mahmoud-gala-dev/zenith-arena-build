// Bilingual (EN/AR) search helpers for the Knowledge Center.
// - Arabic normalization: strip diacritics/tatweel, unify alif/ya/ta marbuta/hamza.
// - English light stemming: lowercased, strip common suffixes (ing, ed, es, s, ly, ment).
// - Tokenization on unicode letters/digits.
// - Scoring: AND semantics over query tokens; each matched token adds weighted score
//   (title matches count more than excerpt/tag matches). Returns 0 if any token misses.

const AR_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g; // tashkeel + tatweel
const AR_NORMALIZE_MAP: Array<[RegExp, string]> = [
  [/[إأآٱ]/g, "ا"],
  [/ى/g, "ي"],
  [/ؤ/g, "و"],
  [/ئ/g, "ي"],
  [/ة/g, "ه"],
];

export function normalizeArabic(input: string): string {
  let s = input.replace(AR_DIACRITICS, "");
  for (const [re, rep] of AR_NORMALIZE_MAP) s = s.replace(re, rep);
  return s;
}

const EN_SUFFIXES = ["ingly", "ment", "ness", "ings", "ing", "edly", "ed", "es", "ly", "s"];

export function stemEnglish(token: string): string {
  let t = token.toLowerCase();
  if (t.length <= 3) return t;
  for (const suf of EN_SUFFIXES) {
    if (t.length - suf.length >= 3 && t.endsWith(suf)) {
      t = t.slice(0, -suf.length);
      break;
    }
  }
  return t;
}

const AR_RANGE = /[\u0600-\u06FF]/;
const TOKEN_RE = /[\p{L}\p{N}]+/gu;

export function normalizeToken(token: string): string {
  if (AR_RANGE.test(token)) return normalizeArabic(token.toLowerCase());
  return stemEnglish(token);
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const matches = text.match(TOKEN_RE);
  if (!matches) return [];
  return matches.map(normalizeToken).filter((t) => t.length > 0);
}

export interface SearchFieldWeights {
  title?: number;
  excerpt?: number;
  tag?: number;
}

export interface SearchableDoc {
  title: string;
  excerpt?: string | null;
  tags?: string[] | null;
  extra?: string | null;
}

const DEFAULT_WEIGHTS: Required<SearchFieldWeights> = { title: 3, excerpt: 1, tag: 2 };

export function scoreDoc(doc: SearchableDoc, queryTokens: string[], weights: SearchFieldWeights = {}): number {
  if (queryTokens.length === 0) return 1; // no query → matches
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const titleTokens = new Set(tokenize(doc.title));
  const excerptTokens = new Set(tokenize(doc.excerpt ?? ""));
  const tagTokens = new Set((doc.tags ?? []).flatMap((t) => tokenize(t)));
  const extraTokens = new Set(tokenize(doc.extra ?? ""));

  let score = 0;
  for (const q of queryTokens) {
    const inTitle = matchesAny(titleTokens, q);
    const inExcerpt = matchesAny(excerptTokens, q);
    const inTag = matchesAny(tagTokens, q);
    const inExtra = matchesAny(extraTokens, q);
    if (!inTitle && !inExcerpt && !inTag && !inExtra) return 0; // AND: every token must match
    if (inTitle) score += w.title;
    if (inTag) score += w.tag;
    if (inExcerpt) score += w.excerpt;
    if (inExtra) score += 0.5;
  }
  return score;
}

// Prefix-or-equal match: query token matches any field token if the field token
// starts with it (covers stemmed forms and short prefixes like "foot" → "football").
function matchesAny(fieldTokens: Set<string>, queryToken: string): boolean {
  if (fieldTokens.has(queryToken)) return true;
  for (const ft of fieldTokens) {
    if (ft.startsWith(queryToken) || queryToken.startsWith(ft)) return true;
  }
  return false;
}

export function parseQuery(raw: string): string[] {
  return tokenize(raw);
}

// Build autocomplete suggestions from a pool of docs given the current query.
// Suggestions are original-cased strings (titles/tags) whose normalized tokens
// start with the last query token. Deduplicated and length-capped.
export function buildSuggestions(pool: SearchableDoc[], rawQuery: string, limit = 6): string[] {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];
  const lastToken = normalizeToken(trimmed.split(/\s+/).pop() ?? "");
  if (!lastToken) return [];
  const seen = new Set<string>();
  const out: Array<{ label: string; weight: number }> = [];

  const consider = (label: string, weight: number) => {
    const clean = label.trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    const toks = tokenize(clean);
    if (!toks.some((t) => t.startsWith(lastToken))) return;
    seen.add(key);
    out.push({ label: clean, weight });
  };

  for (const d of pool) {
    consider(d.title, 3);
    for (const tg of d.tags ?? []) consider(tg, 2);
    if (out.length >= limit * 4) break;
  }
  out.sort((a, b) => b.weight - a.weight || a.label.length - b.label.length);
  return out.slice(0, limit).map((x) => x.label);
}
