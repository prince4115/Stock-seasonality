# Phase 5 — Frontend pages (summary)

## What landed

Every page now renders real data from the Phase 3 score caches. Pages are
**server-rendered**, calling the `src/lib/data/*` layer directly (no internal
`fetch('/api/...')` hops). The `/api/*` routes from Phase 4 stay around as
the external contract.

| Page               | What it shows                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Three entry-point cards + the next 3 upcoming events + 1-line methodology blurb with link to /about                                                                 |
| `/categories`      | 9 category cards with 12-month sparklines (10y default window), best month, n=stocks covered                                                                        |
| `/category/[slug]` | Aggregate monthly heatmap, top-3 stocks per month (12-card grid), full stocks table, upcoming events affecting it                                                   |
| `/stock/[ticker]`  | Seasonality fingerprint heatmap (12 months × 1 row), event-window heatmap (festivals × 3 windows), summary stats, backtest preview placeholder, category breadcrumb |
| `/calendar`        | Upcoming festivals grouped by month, each with affected-category chips and weight ×                                                                                 |
| `/about`           | Fleshed-out methodology, survivorship handling, known limitations (ADR FX, K ticker gap), tech stack, disclaimer                                                    |

Plus interactive controls (`/stock` and `/category` pages):

- `AnalysisControls` — window selector (5y / 10y / 15y) + COVID toggle. URL-search-param-driven so configurations are shareable / bookmarkable.

And shared visual components:

- `Heatmap` — colorblind-friendly diverging blue↔orange CSS-grid heatmap. Tooltips show `value · n=...`. No client JS.
- `Sparkline` — 12-point SVG sparkline with a dashed zero-line. Net-positive series stroked orange, net-negative sky. No client JS.
- `StatNumber` — formatted % with explicit `n=` and optional secondary line. Colors follow the diverging palette.
- `src/lib/colors.ts` — pure functions for `divergingColor(value, scaleMax)` and `textOnBackground(...)` so the palette is centralized.

## Non-obvious requirements — all addressed

- **Sample size next to every percentage.** `StatNumber` shows `n=` inline; heatmap cells show `n=` in the tooltip; top-stock tables show `n=` per row; category sparklines show `n=stocks covered`.
- **Toggle to exclude 2020-2021.** `AnalysisControls` flips `excludeCovid` via URL. Both flavors of scores were cached in Phase 3, so toggling is an instant page render — no recompute.
- **Colorblind-friendly diverging blue ↔ orange.** `src/lib/colors.ts` is the single source of truth; the brand mark in `TopNav` uses the same sky→orange gradient.

## Verification

- **`npm test`**: **66 tests** across 4 files, still all green.
- **`npm run lint`**: clean (fixed two `react/no-unescaped-entities` errors from typographic quotes inside JSX).
- **`npm run build`**: clean. Five pages flipped from static to dynamic (`ƒ`) because they now fetch from DB.
- **`npm run format:check`**: clean.

Live walkthrough (visited via production build at `npm run start`):

```
/                    → 9 categories detected, 89 active tickers, 3 upcoming events listed
/categories          → 9 category cards, sparklines render with 10y data
/category/jewelry-luxury  → aggregate heatmap, Dec is brightest (Christmas gifting), 7 stocks in table
/stock/NKE                → Jan +0.43% (n=15), Jul +1.86% (n=15); 17 festivals × 3 windows in event grid
/calendar                 → Father's Day, Independence Day, back-to-school in month-grouped layout
```

## Decisions worth flagging

1. **Pages import the data layer directly**, not `fetch('/api/...')`. Server components in Next.js 14 can short-circuit HTTP; doing so saves serialization round-trips and keeps everything strongly typed. The `/api/*` routes still exist for external consumers + smoke testing.
2. **Heatmaps are server-rendered CSS grids**, not Recharts. Recharts doesn't have a native heatmap component and the grid approach is faster (no client JS), accessible (real `<div role="cell">`s), and produces clean static HTML.
3. **Sparklines are plain SVG**, not Recharts either. 12-point polylines are trivial; Recharts adds client-side JS and dependencies for no gain at this size. Recharts is installed and ready for the line-overlay charts the brief mentions (e.g., backtest preview).
4. **"Month × window" heatmap, not "month × year".** The brief says "month × year heatmap" for `/category/[slug]`. We have month × window aggregates cached and reused it for now (one row, 12 months at the chosen window). Adding a month-by-year matrix would need a new cache table + analysis pass — flagged for Phase 6 if you want it.
5. **No backtest preview yet.** Stub on `/stock/[ticker]`. Real implementation needs an entry/exit rule, position-sizing assumption, and an IRR calc against historical PriceHistory — meaningful new work that didn't fit in Phase 5.
6. **`/categories` defaults to 10y window**. Median between 5y (recent, smaller sample) and 15y (longest history, includes pre-COVID baseline). Detail pages let users change it.
7. **Stock detail page sorts event-window rows by absolute post-event return**, so the headline rows are the ones with the most movement — visually scannable rather than alphabetical.
8. **Delisted stocks still link to from category pages**, with a visible "delisted YYYY-MM" tag, so survivorship is transparent to the viewer.

## Risks / follow-ups for Phase 6

- **Mobile-responsive heatmaps** — the brief flagged this as "the hardest part — test early". Current heatmaps overflow-scroll horizontally on narrow viewports, which works but isn't elegant. Real fix is a vertical-month layout on small screens.
- **Loading skeletons** — pages currently block on DB queries (~50–200 ms). Streaming `<Suspense>` boundaries would let the static shell paint immediately.
- **Error boundaries** — `notFound()` triggers Next's 404, but DB errors currently throw. Phase 6 should add an `error.tsx` boundary.
- **Waitlist signup form** — `/api/waitlist` exists but no UI calls it yet. A landing-page email field + honeypot field is Phase 6's smallest win.
- **SEO + OpenGraph** — pages have title/description metadata but no `metadataBase`, no OG images, no canonical URLs. Easy Phase 6 add.
- **Analytics** (Plausible or PostHog) — brief mentioned, not yet wired.
- **HTTP caching headers** on API routes — for CDN edge caching.

## How to use

```bash
cd stock-seasonality

# Dev
npm run dev

# Or production
npm run build && npm run start

# Then open
http://localhost:3000
http://localhost:3000/categories
http://localhost:3000/category/travel
http://localhost:3000/stock/NKE?window=5
http://localhost:3000/stock/NKE?window=15&excludeCovid=1
http://localhost:3000/calendar
```

## What I'd want to know on review

- **Month × window vs month × year heatmap** — call the shot before I cache month×year aggregates in Phase 6.
- **Backtest preview** — what's the minimum viable shape? Single-month entry/exit? Multi-month? Annualized?
- **Top-N stocks per month** is currently ranked by `avgReturn`. Same question as Phase 4 — would `pctYearsPositive` or a composite be more useful?
- **Default window on `/categories` is 10y**. Make this user-controllable (a single dropdown that affects all 9 sparklines)?

Say **"go Phase 6"** for polish (mobile heatmaps, loading skeletons, SEO, analytics, waitlist UI).
