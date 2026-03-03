/**
 * TapTrao Analytics — UTM tracking + GA4 custom events
 *
 * Usage:
 *   import { initUtmTracking, trackEvent } from '@/lib/analytics';
 *   initUtmTracking();                           // call once on app mount
 *   trackEvent('lead_captured', { source: 'post_check' });
 */

// ── Types ──────────────────────────────────────────────
export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

// ── Constants ──────────────────────────────────────────
const UTM_STORAGE_KEY = "taptrao_utm";
const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

// ── UTM Parsing & Persistence ──────────────────────────

/**
 * Parse UTM params from the current URL, persist to sessionStorage,
 * and POST them to the server for session-level attribution.
 * Call once on app mount.
 */
export function initUtmTracking(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  let hasUtm = false;

  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) {
      utm[key] = val;
      hasUtm = true;
    }
  }

  if (!hasUtm) return;

  // Store client-side for event enrichment
  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));

  // Persist server-side for lead attribution
  fetch("/api/session/utm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(utm),
  }).catch(() => {});
}

/**
 * Retrieve stored UTM params (from sessionStorage).
 */
export function getUtmParams(): UtmParams {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

// ── GA4 Event Helper ───────────────────────────────────

/**
 * Fire a GA4 custom event enriched with UTM attribution data.
 * No-ops gracefully if gtag is not loaded (cookie consent rejected).
 */
export function trackEvent(
  name: string,
  extra?: Record<string, string | number>,
): void {
  if (typeof window === "undefined") return;
  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;

  const utm = getUtmParams();
  gtag("event", name, { ...utm, ...extra });
}
