/**
 * Cache-Control header constants for API routes.
 *
 * We use `s-maxage` (CDN-shared cache) rather than `max-age` (browser
 * cache). The CDN can serve cached responses to many users; the browser
 * always sees a fresh-feeling page on next click.
 *
 * `stale-while-revalidate` lets the CDN serve stale content immediately
 * while it fetches fresh data in the background — best of both worlds.
 */

/**
 * For score endpoints that change only when we re-run `npm run analyze`
 * (typically once a week). 1h fresh, 24h stale.
 */
export const SCORES_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

/**
 * For event-upcoming endpoint — content changes as days pass. 30m fresh,
 * 6h stale is plenty for "what's coming next?".
 */
export const EVENTS_CACHE = "public, s-maxage=1800, stale-while-revalidate=21600";

/**
 * For mutating endpoints — never cache.
 */
export const NO_CACHE = "no-store, max-age=0";
