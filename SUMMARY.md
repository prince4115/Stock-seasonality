# Phase 4 — API routes (summary)

## What landed

**Five route handlers** under `src/app/api/`, all reading from the Phase 3
cached score tables — zero compute on the request path.

| Route                  | Method | Purpose                                                                                 |
| ---------------------- | ------ | --------------------------------------------------------------------------------------- |
| `/api/categories`      | GET    | All 9 categories with `stockCount` (active stocks only)                                 |
| `/api/category/[slug]` | GET    | One category + its stocks + monthly aggregate heatmap + top 3 stocks per month          |
| `/api/stock/[ticker]`  | GET    | One stock + its 12 monthly scores + all event-window scores                             |
| `/api/events/upcoming` | GET    | Upcoming festivals (date >= today) with affected categories and `daysUntil`             |
| `/api/waitlist`        | POST   | Email signup with validation, IP-hash rate limit (3/hour), 201/400/409/429 status codes |

**Data layer** under `src/lib/data/` — thin Prisma wrappers the routes
import:

- `categories.ts` — `getAllCategories`, `getCategoryBySlug`
- `stocks.ts` — `getStockByTicker`, `getStocksByCategorySlug`
- `scores.ts` — `getMonthlyScores`, `getEventScores`, `getCategoryMonthlyAggregate` (raw SQL aggregate), `getTopSeasonalStocksForMonth`, plus `parseWindow` / `parseExcludeCovid` query-param helpers
- `festivals.ts` — `getUpcomingFestivals`, `parseRegion`
- `waitlist.ts` — `addToWaitlist`, `emailExistsInWaitlist`, `countRecentSignupsByIp`

**Rate limiting** — `src/lib/rate-limit.ts`. Composable pieces:

- `isValidEmail(unknown): boolean` — type guard, trims, length-capped at 254
- `extractClientIp(headers)` — `x-forwarded-for` first hop, fallback to `x-real-ip`
- `hashIp(ip)` — HMAC-SHA256 with `RATE_LIMIT_SALT` env var (raw IPs never stored)
- `decideAllow(count, max)` — pure policy
- `checkRateLimit(ipHash)` — composite DB + policy

**Vitest config** — added `vitest.config.ts` with the `@/` path alias and
`dotenv/config` so test files that transitively import the Prisma client
can resolve the DATABASE_URL.

## Verification

- **`npm test`**: **66 tests across 4 files**, all green (50 from Phase 3 + 16
  new for rate-limit).
- **`npm run lint`**: clean.
- **`npm run build`**: clean. New routes show up as dynamic (ƒ) in the route
  list.
- **`npm run format:check`**: clean.

**Live smoke tests** via curl against the dev server:

```
GET /api/categories                  → 9 categories, stockCount per category
GET /api/category/travel?window=5    → 12 stocks, 12 monthlyAggregate rows,
                                       top stocks per month (e.g. Jan: RCL
                                       +13.3% avg, 80% positive, n=5)
GET /api/category/nonexistent        → 404 { error: "category not found" }
GET /api/stock/NKE?window=10         → 12 monthly + 51 event-window rows;
                                       Jan: +0.39%, 50% positive, n=10
GET /api/events/upcoming?limit=3     → Father's Day → Independence Day →
                                       back-to-school, with affected categories
GET /api/events/upcoming?region=IN   → Diwali occurrences
POST /api/waitlist (valid email)     → 201 { ok: true }
POST /api/waitlist (same email)      → 409 { error: "already signed up" }
POST /api/waitlist (bad email)       → 400 { error: "invalid email" }
POST /api/waitlist (bad JSON body)   → 400 { error: "invalid json" }
```

The smoke-test signup row was cleaned up from `WaitlistSignup` after
verification.

## Decisions worth flagging

1. **`force-dynamic` on every route.** Each GET reads from DB and the
   query params drive content — there's no benefit to attempting static
   generation. We can add HTTP cache headers (`Cache-Control: s-maxage`)
   in Phase 6 polish for CDN edge caching, but for Phase 4 we keep it
   simple.
2. **Email + IP rate-limit only, no captcha or honeypot.** Three signups
   per IP per hour is enough for an honest user (rare to need more) and
   slow enough to deter a basic abuser. If we see spam we'll add a
   honeypot field in the frontend Phase 5 sign-up form before reaching
   for hCaptcha.
3. **IP hashing with HMAC-SHA256 + salt.** Raw IPs never touch
   `WaitlistSignup`. `RATE_LIMIT_SALT` env var; a constant fallback for
   dev. The deploy story is to set this on Vercel before launch.
4. **Top-stocks ranking by `avgReturn`** for the category's per-month
   top-N. We could rank by `pctYearsPositive` or a composite — for now
   `avgReturn` matches what the brief describes ("top seasonal stocks").
5. **Category aggregate uses raw SQL** (`$queryRaw`) for `AVG()` across
   stocks. Prisma's groupBy supports this but the SQL is clearer and the
   joins are explicit. The category filter respects `delisted=false`
   here — Phase 3 survivorship review item ("filter analysis output by
   whether the stock had data within the requested window") is
   satisfied at the score-row level: only rows with `sampleSize > 0`
   were ever inserted.
6. **Race on /api/waitlist between "email exists" check and INSERT** is
   handled by catching the Prisma unique-constraint error and converting
   to 409. The check is still useful for the happy-path response time.

## Risks / follow-ups for Phase 5+

- **No streaming/SSE.** All routes return JSON. Phase 5 frontend should
  be fine with this.
- **No HTTP caching headers.** When this hits Vercel, edge caching will
  matter — Phase 6.
- **No CSRF protection on /api/waitlist** because there's no
  session. The endpoint is idempotent enough (duplicate emails 409) and
  the rate limit caps abuse.
- **`parseWindow` defaults to 15y.** If a stock doesn't have 15y of
  history (e.g. ABNB IPO'd 2020), `monthly` will return fewer than 12
  rows for the 15y window. Phase 5 should look at the response's row
  count vs. expected 12 to decide whether to fall back to a shorter
  window UI-side.
- **`/api/category/[slug]` issues ~14 queries** (1 for category, 1 for
  stocks, 1 raw aggregate, 12 top-N per month). Promise.all parallelizes
  the per-month queries. Could collapse to a single windowed SQL query
  later if this is slow under load.

## How to use

```bash
# Dev
npm run dev

# Then in another shell:
curl -s http://localhost:3000/api/categories | jq
curl -s "http://localhost:3000/api/category/jewelry-luxury?window=10" | jq
curl -s "http://localhost:3000/api/stock/NKE?window=15&excludeCovid=1" | jq
curl -s "http://localhost:3000/api/events/upcoming?region=IN&limit=5" | jq

# Waitlist signup
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","source":"landing"}' \
  http://localhost:3000/api/waitlist
```

## What I'd want to know on review

- Are the **response shapes** what Phase 5 wants? In particular,
  `/api/category/[slug]` returns four sections (`category`, `stocks`,
  `monthlyAggregate`, `topStocksByMonth`) — happy to split into separate
  endpoints if you'd rather have the page issue parallel fetches.
- **3 signups per IP per hour** is a reasonable default — if you want
  tighter (1/hour) or looser, easy knob.
- **Top-N ranking** — `avgReturn` vs `pctYearsPositive`? The brief
  doesn't specify.

Say **"go Phase 5"** when ready — frontend wiring is next.
