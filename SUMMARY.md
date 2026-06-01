# Phase 6 — Polish (summary)

## What landed

**Mobile-responsive heatmaps** — the brief's flagged "hardest part":

- First column (row labels) is now `position: sticky; left: 0` so it stays
  visible while the user scrolls the rest horizontally.
- Cells shrink on small viewports (`px-1` and `text-[10px]` < 640px;
  `px-2` and `text-[11px]` ≥ 640px).
- Right-edge gradient fade on mobile signals there's more to see, plus a
  "Swipe horizontally to see all columns" hint below the grid.
- Sticky header subtle shadow so labels feel layered over data.

**Loading skeletons** — Next.js 14 App Router route-level `loading.tsx`:

- `src/app/loading.tsx` — generic 6-card grid fallback.
- `src/app/stock/[ticker]/loading.tsx` — shape-matched: page header,
  breadcrumb, controls, 4-up summary stats, fingerprint band, event-window
  table.
- `src/app/category/[slug]/loading.tsx` — shape-matched: header, controls,
  4-up stats, heatmap, 12-card grid.
- New `Skeleton` primitive: pulsing zinc-200 / dark:zinc-800 block.

**Error boundaries**:

- `src/app/error.tsx` — client component with `reset()` retry button and
  back-home link; logs the error and surfaces the `digest` for support.
- `src/app/not-found.tsx` — friendly 404 with links into `/categories`,
  `/calendar`. Reaches users from both unmatched routes and explicit
  `notFound()` calls (unknown ticker, unknown category slug).

**Waitlist signup form** — `src/components/WaitlistForm.tsx`:

- Client component on the landing page (`source="landing"`).
- Email validation + disabled-while-submitting state + tailored
  messages for 409 (already signed up), 429 (rate-limited), 400 (bad email),
  network errors.
- Honeypot: hidden `website` field. Bots auto-fill it; real users don't.
  Server returns 201 either way so bots can't distinguish — checked in
  `/api/waitlist`.

**SEO + OpenGraph**:

- `metadataBase` set from `NEXT_PUBLIC_APP_URL` in root layout.
- OG, Twitter, and `keywords` metadata for the global default.
- `app/robots.ts` → generates `/robots.txt` (allow everything except `/api`).
- `app/sitemap.ts` → generates `/sitemap.xml` enumerating static pages
  - every active stock + every category, with the right `changeFrequency`
    per route type.
- ⚠️ Dynamic OG image (`opengraph-image.tsx`) prototyped but pulled —
  `@vercel/og` chokes on the space in the local Windows path
  ("New folder/..."). The static OG metadata is enough for sharing
  previews until we deploy to Vercel; we can add `public/og.png` or
  re-enable the dynamic route there.

**Plausible analytics** — `src/components/Analytics.tsx`:

- Injected at the bottom of the root layout via `next/script` with
  `strategy="afterInteractive"`.
- No-op when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is unset so local dev doesn't
  pollute production stats.
- Cookieless, no consent banner needed.

**HTTP cache headers** — `src/lib/http-cache.ts`:

- `SCORES_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400"`
  on `/api/categories`, `/api/category/[slug]`, `/api/stock/[ticker]`.
  CDN serves stale immediately, revalidates in the background.
- `EVENTS_CACHE = "public, s-maxage=1800, stale-while-revalidate=21600"`
  on `/api/events/upcoming` (shorter since "upcoming" changes daily).
- `/api/waitlist` (POST) intentionally stays no-cache.

**`.env.example` updates** — documented `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and
`RATE_LIMIT_SALT` for production deploy.

## Verification

- **`npm test`**: 66 tests across 4 files, all green.
- **`npm run lint`**: clean.
- **`npm run build`**: clean. 14 routes (10 page routes + 4 API routes) +
  `/robots.txt` and `/sitemap.xml` built. New skeletons + error pages
  show up as expected.
- **`npm run format:check`**: clean.
- Mobile-responsive heatmap visually verified via dev server at viewport
  widths 360px / 640px / 1024px.

## Decisions worth flagging

1. **Horizontal-scroll heatmap, not transposed layout.** The Phase 5
   SUMMARY hinted at a "vertical-month layout on small screens." Tried it;
   lost the visual scan that makes heatmaps useful. Sticky labels +
   smaller cells + scroll affordances ended up better — you can still read
   one row across all 12 columns by swiping.
2. **Loading skeletons are shape-matched, not generic.** A generic gray
   block at top is mildly worse than no skeleton at all (because it
   resizes on data arrival). The route-specific `loading.tsx` files mirror
   the real page structure so the transition is no-jump.
3. **No global app `loading.tsx` for `/about`** — it's static, renders
   instantly, doesn't need a skeleton.
4. **Honeypot, not captcha.** Adding hCaptcha or reCAPTCHA is a
   privacy-and-bundle-size tradeoff we don't need yet. The hidden-field
   honeypot catches 90%+ of dumb bots; rate limit catches the rest.
5. **Dynamic OG images deferred.** The infrastructure (`opengraph-image.tsx`
   shape, `next/og` import) is fine, but `@vercel/og` resolves a `file://`
   URL internally and the space in `"New folder"` breaks `fileURLToPath`.
   It'll work on Vercel/Linux. Removed the file; reintroduce after deploy.
6. **Analytics is no-op until env var set.** Avoids the Plausible script
   loading in dev (which would post events to production stats and skew
   numbers). Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` on Vercel + create the
   site at plausible.io.
7. **Cache headers coexist with `force-dynamic`.** `force-dynamic` tells
   Next.js to render at request time; `Cache-Control: s-maxage` tells the
   CDN it's OK to serve cached responses. Together: server always renders
   fresh, CDN caches per (URL + query-params).
8. **Sitemap is built at deploy time, not refreshed dynamically.** Means
   newly seeded tickers don't appear in the sitemap until a redeploy.
   Acceptable for a daily-refresh project; we can move to ISR
   (`revalidate = 3600`) if SEO matters more later.

## Risks / follow-ups (post-Phase-6)

- **Dynamic OG image** still wants to ship for `/stock/[ticker]` and
  `/category/[slug]`. Each card should show "+12.3% Jul, n=15" or similar.
  Recipe is in the deleted `opengraph-image.tsx`; re-enable post-deploy.
- **Mobile heatmap with many rows** (the event-window grid on
  `/stock/[ticker]` has ~17 rows) still scrolls vertically a long way on
  phones. Could collapse to top-3 events on mobile with "show all" toggle.
- **No CSRF on `/api/waitlist`.** Rate-limit + honeypot + unique email
  cover the abuse vectors that matter for a waitlist. CSRF would matter
  if we add authenticated mutations later.
- **No client-side error boundary inside the data sections.** Errors in
  the server component bubble to `app/error.tsx`, which replaces the whole
  page. Inline `<Suspense>` boundaries around each section would let part
  of the page survive a single failed query.
- **`/api/category/[slug]` still does 14 queries** (1 category + 1 stocks
  - 1 raw aggregate + 12 top-N per month). Promise.all parallelizes
    them but it's still N round-trips. A single windowed-aggregation SQL
    could collapse it. Phase 7 perf-pass if needed.

## How to use the new bits

```bash
# Plausible analytics — set in production env only
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="seasonality.example.com"

# Rate-limit salt — generate a random one for production
RATE_LIMIT_SALT="$(openssl rand -hex 32)"

# Verify caching
curl -I http://localhost:3000/api/categories
#   Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400

curl -I http://localhost:3000/api/waitlist -X POST
#   (no Cache-Control, default no-store)

# Inspect sitemap
curl http://localhost:3000/sitemap.xml | head -20
```

## What's still on the board (originally planned, intentionally skipped)

- **Backtest preview UI** on `/stock/[ticker]` — still a placeholder.
  Needs entry/exit rule + IRR computation; Phase 7 territory.
- **Month × year heatmap** on `/category/[slug]` — needs a new cache table
  for per-year-per-month-per-category aggregates. Phase 7 if you want it.
- **Per-page dynamic OG images** — pulled due to the Windows path issue
  noted above. Post-deploy follow-up.

All 6 brief phases shipped. Tests green, lint green, build green. Phase 7+
ideas live in `notes/future-ideas.md` (currently has the demo-account
trial idea from earlier).
