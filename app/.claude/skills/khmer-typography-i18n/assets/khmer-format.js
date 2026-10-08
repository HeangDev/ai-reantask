/**
 * khmer-format.js — framework-agnostic helpers for Khmer (km-KH) i18n.
 * Works in modern browsers and Node 18+ (needs Intl.Segmenter for segmentation helpers).
 * Copy into the project (e.g. src/lib/khmer-format.js) and adjust CONFIG to the house style.
 */

export const CONFIG = {
  locale: "km-KH",
  timeZone: "Asia/Phnom_Penh",
  useKhmerDigits: false,      // true → ០១២៣…, false → 0123…
  rielStyle: "symbol",        // "symbol" → 40,000៛   "word" → 40,000 រៀល
  usdSymbolFirst: true,       // true → $12.50 (common in Cambodia), false → Intl default
};

const ZWSP = "\u200B";
const ZWNJ = "\u200C";
const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

function numLocale() {
  return CONFIG.useKhmerDigits ? `${CONFIG.locale}-u-nu-khmr` : CONFIG.locale;
}

// ---------- Digits ----------

export function toKhmerDigits(input) {
  return String(input).replace(/[0-9]/g, (d) => KHMER_DIGITS[d]);
}

export function toLatinDigits(input) {
  return String(input).replace(/[\u17E0-\u17E9]/g, (d) => String(d.charCodeAt(0) - 0x17e0));
}

/** Parse a user-typed number that may contain Khmer digits, spaces or grouping commas. */
export function parseNumber(input) {
  const cleaned = toLatinDigits(input).replace(/[\s,\u00A0]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

// ---------- Numbers & money ----------

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(numLocale(), options).format(value);
}

/** Riel: no decimals in practice. */
export function formatRiel(amount) {
  const n = formatNumber(Math.round(amount), { maximumFractionDigits: 0 });
  return CONFIG.rielStyle === "word" ? `${n} រៀល` : `${n}៛`;
}

export function formatUSD(amount) {
  if (CONFIG.usdSymbolFirst) {
    const n = formatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${n}`;
  }
  return new Intl.NumberFormat(numLocale(), { style: "currency", currency: "USD" }).format(amount);
}

/**
 * "$10.00 (≈ 41,000៛)". Pass the rate from config/API — never hardcode it.
 */
export function formatDual(usd, rielPerUsd) {
  return `${formatUSD(usd)} (≈ ${formatRiel(usd * rielPerUsd)})`;
}

// ---------- Dates ----------

export function formatDate(date, options = { dateStyle: "long" }) {
  return new Intl.DateTimeFormat(numLocale(), { timeZone: CONFIG.timeZone, ...options }).format(
    new Date(date)
  );
}

export function formatTime(date, options = { timeStyle: "short" }) {
  return new Intl.DateTimeFormat(numLocale(), { timeZone: CONFIG.timeZone, ...options }).format(
    new Date(date)
  );
}

/** e.g. formatRelative(-3, "day") → "3 ថ្ងៃមុន" (may contain ZWSP; strip if comparing). */
export function formatRelative(value, unit) {
  return new Intl.RelativeTimeFormat(numLocale(), { numeric: "auto" }).format(value, unit);
}

// ---------- Phone ----------

/** Normalize Cambodian phone input ("012 345 678", "០១២៣៤៥៦៧៨", "+855 12…") to E.164. */
export function normalizeKhPhone(input) {
  let d = toLatinDigits(input).replace(/[^\d+]/g, "");
  if (d.startsWith("+855")) d = d.slice(4);
  else if (d.startsWith("855")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^\d{8,9}$/.test(d) ? `+855${d}` : null;
}

// ---------- Segmentation, wrapping, truncation ----------

const hasSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl;

/** Split into visible clusters (grapheme clusters). */
export function graphemes(text) {
  if (!hasSegmenter) return Array.from(text); // fallback: may split clusters
  const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
  return Array.from(seg.segment(text), (s) => s.segment);
}

export function graphemeLength(text) {
  return graphemes(text).length;
}

/** Truncate without cutting a Khmer cluster in half. */
export function truncateGraphemes(text, max, ellipsis = "…") {
  const g = graphemes(text);
  return g.length <= max ? text : g.slice(0, max).join("") + ellipsis;
}

/** Split Khmer text into words using the browser/ICU dictionary. */
export function words(text) {
  if (!hasSegmenter) return [text];
  const seg = new Intl.Segmenter("km", { granularity: "word" });
  return Array.from(seg.segment(text), (s) => s.segment);
}

/**
 * Insert ZWSP between Khmer words so any browser can wrap long runs.
 * Use for display only — strip with stripZwsp() before search/storage.
 */
export function insertBreakOpportunities(text) {
  if (!hasSegmenter) return text;
  const seg = new Intl.Segmenter("km", { granularity: "word" });
  let out = "";
  let prevKhmer = false;
  for (const { segment } of seg.segment(stripZwsp(text))) {
    const isKhmer = /[\u1780-\u17FF\u19E0-\u19FF]/.test(segment);
    if (isKhmer && prevKhmer) out += ZWSP;
    out += segment;
    prevKhmer = isKhmer;
  }
  return out;
}

export function stripZwsp(text) {
  return String(text).replaceAll(ZWSP, "");
}

// ---------- Search & sort ----------

/** Normalize for comparison: NFC, strip ZWSP/ZWNJ, collapse whitespace, lowercase Latin. */
export function normalizeForSearch(text) {
  return String(text)
    .normalize("NFC")
    .replaceAll(ZWSP, "")
    .replaceAll(ZWNJ, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function khmerIncludes(haystack, needle) {
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}

const collator = new Intl.Collator("km");
export function compareKhmer(a, b) {
  return collator.compare(a, b);
}
// usage: items.sort((x, y) => compareKhmer(x.name, y.name))