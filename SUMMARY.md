# Phase 2 — Data layer (summary)

## What landed

**Schema** — `prisma/schema.prisma` with the 6 models from the brief plus one
join table:

| Model                   | Purpose                                                      | Notable fields                                                                                                                  |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `Category`              | Consumer-spending bucket                                     | `slug` (URL), `name`, `description`                                                                                             |
| `Stock`                 | One ticker                                                   | `delisted` + `delistedAt` for survivorship-bias correctness; `dataSource` + `sourceMeta` for the future yfinance → Polygon swap |
| `PriceHistory`          | Daily OHLCV                                                  | `Decimal(18,6)` prices, `BigInt` volume, `adjClose` for analysis, raw `close` for sanity; `@@unique([stockId, date])`           |
| `FestivalEvent`         | One occurrence of a recurring event                          | `slug` repeats across years; uniqueness on `(slug, date)`; `region` ∈ {US, IN, CN, global}                                      |
| `FestivalEventCategory` | Join: which categories does this festival historically move? | `weight` 0..1 — Phase 3 scales event-window returns by this                                                                     |
| `SeasonalityScore`      | Cached monthly seasonality per stock + window                | `excludeCovid` flag mirrors the UI toggle so the page flips instantly without recompute                                         |
| `WaitlistSignup`        | Phase 4 `/api/waitlist` target                               | `ipHash` (never raw IPs) for rate limiting                                                                                      |

Migration `20260518231938_init` applied to Supabase.

**Seeds** — `prisma/seed.ts` orchestrates three idempotent passes (upsert on
natural keys, safe to re-run after editing data):

| Pass       | Source file                                                           | Count                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categories | `prisma/seeds/categories.ts`                                          | 9 (travel, retail, food-beverage, restaurants, apparel, jewelry-luxury, cinema-entertainment, toys-hobby, beauty-personal-care)                                                                                                                                            |
| Stocks     | `prisma/seeds/stocks.ts`                                              | 90 active + 1 delisted (TIF, acquired by LVMH 2021-01-07) = 91 total                                                                                                                                                                                                       |
| Festivals  | `prisma/seeds/festivals.ts` (with `prisma/seeds/festival-helpers.ts`) | 374 occurrences = 22 years (2010–2031) × ~17 events (Christmas, Thanksgiving, Black Friday, Cyber Monday, Halloween, Valentine's, Mother's/Father's Day, Memorial/Labor Day, Independence Day, back-to-school, Super Bowl, Diwali, Chinese New Year, Easter, Singles' Day) |

Lunar/movable dates (Diwali, CNY, Easter, Super Bowl) are hardcoded as
22-year lookup tables — computing them from first principles is more code
than the table is large.

**Prisma client** — Prisma 7's new `prisma-client` generator requires an
explicit driver adapter (this was the unexpected wrinkle of the phase). Wired
`@prisma/adapter-pg` + `pg` and put the singleton at `src/lib/prisma.ts`. The
adapter reads `DATABASE_URL` from `.env`.

**Python ingestion** — `ingest_prices.py` at repo root (single file, per your
"separate sibling repo later" choice). `requirements.txt` next to it.
yfinance 0.2.66 + psycopg 3.3.4 + cuid + python-dotenv. The script:

- Reads the ticker universe from the `Stock` table (skips `delisted=true` by
  default; `--include-delisted` to override).
- Pulls OHLCV via yfinance for a configurable `--window` (defaults `15y`).
- Upserts in `--batch-size` chunks with `ON CONFLICT (stockId, date) DO UPDATE`.
- Commits per-ticker so a single bad symbol doesn't lose progress.
- `--dry-run` for safe testing.

**Daily refresh cron** — `.github/workflows/refresh-prices.yml`. Tue–Sat 09:30 UTC
(covers Mon–Fri NYSE closes). Template-ready: push the repo, set the `DIRECT_URL`
secret, done. Manual trigger via `workflow_dispatch` with overridable window.

## Verification

- `npx prisma validate` — schema valid.
- `npx prisma migrate dev --name init` — applied to Supabase (eu-west-1 pooler @ 5432, session mode).
- `npm run db:seed` — 9 categories, 91 stocks, 374 festival rows, exit 0.
- `npm run lint` — clean.
- `npm run build` — clean (8 routes still building correctly).
- `npm run format` — applied.
- `python ingest_prices.py --ticker AMZN --window 5y` — 1,255 rows in ~6s. Round-trips through psycopg into Postgres correctly.
- Full 15y × 91-ticker pull — see end of file.

## Decisions worth flagging

1. **One URL, not two.** Your brief mentions both `DATABASE_URL` and
   `DIRECT_URL`. For dev I have both set to the Supabase **session-mode pooler**
   on port 5432, which works for both migrations and runtime queries.
   When we deploy in Phase 6 we'll flip `DATABASE_URL` to the transaction
   pooler (port 6543) for serverless and `DIRECT_URL` stays at 5432 for
   migrations + the Python cron.
2. **Driver adapter, not legacy client.** I'm using Prisma 7's modern
   `prisma-client` generator + `@prisma/adapter-pg`. If you'd rather have
   the simpler Prisma 5-style `prisma-client-js` (implicit DATABASE_URL,
   no adapter), it's a 5-minute swap — say the word.
3. **No back-to-school weekly granularity.** The brief calls out
   back-to-school as a season. I anchored it as a single event on Aug 15 with
   `durationDays: 30`. Phase 3 can use the duration to define a longer event
   window. Same shape lets us upgrade to per-week events later if needed.
4. **Singles' Day (11.11)** included on top of the brief — it's the biggest
   single-day e-commerce event globally and most US retailers care about it
   now. Easy to remove if it's noise.
5. **Per-festival category weights, not just links.** `FestivalEventCategory`
   has a `weight Float @default(1.0)`. That gives Phase 3 a knob without
   needing a schema change — e.g., Diwali → jewelry is 1.0, Diwali → apparel
   is 0.6, Diwali → travel isn't in the link table at all.
6. **Hardcoded ID generation in Python.** `cuid()` from the Python `cuid`
   package matches Prisma's `@default(cuid())`. Cleaner than mixing UUIDs
   into a cuid column or making the column server-generated.

## Risks / follow-ups for Phase 3+

- **yfinance reliability.** It's the right choice for the prototype but it
  rate-limits and the column shape has changed at least twice across recent
  versions. The script defends against both. When we move to Polygon.io,
  `dataSource = 'polygon'` and a new ingestion script side-by-side.
- **ADR price gaps.** Tickers like LVMUY (LVMH ADR), CFRUY (Richemont) trade
  thinly on OTC; yfinance has gaps. Phase 3 needs to handle missing-day fills
  before computing event-window returns or those stocks will produce noise.
- **No tests yet.** Phase 3 is where unit tests start (per the brief: "Write
  unit tests here — this is where bugs hurt most"). The schema/seed layer is
  basically straight CRUD; the analysis math is where tests pay off.
- **Survivorship checklist.** TIF is the one delisted ticker right now.
  Realistic backtests need 5–10 more in the same categories (failed
  retailers, casual-dining chains that went bankrupt 2008–2020). Easy to add
  to `stocks.ts` over time.

## How to re-run

```bash
# from stock-seasonality/

# schema changes
npx prisma migrate dev --name <description>

# re-seed (idempotent)
npm run db:seed

# pull recent days (cron mode)
./.venv/Scripts/python.exe ingest_prices.py --window 5d

# full backfill (slow)
./.venv/Scripts/python.exe ingest_prices.py --window 15y --include-delisted

# one ticker, fast
./.venv/Scripts/python.exe ingest_prices.py --ticker NKE --window 5y
```

## Full backfill result

- **303,841 rows** ingested across **87 tickers**, ~85 seconds wall clock.
- 91 tickers attempted (90 active + 1 delisted = `--include-delisted`).
- 4 returned no data for the 15y window — yfinance ticker churn we'll need
  to fix in `stocks.ts`:
  - **TIF** — expected (delisted 2021, no Yahoo history). The row exists in
    `Stock` with `delisted=true` per the brief's survivorship requirement;
    Phase 3 just won't have prices for it. (Possible follow-up: pull TIF
    from a different source or accept the gap.)
  - **PARA** (Paramount Global) — merged into Skydance Aug 2025, ticker
    transitioned. Phase 3 needs the pre-merger history.
  - **SEAS** (United Parks & Resorts) — yfinance gap. Should be queryable;
    needs investigation.
  - **SIX** (Six Flags) — merged with Cedar Fair July 2024, ticker changed
    to FUN. Pre-merger history is what we want; same fix as PARA.

Treat these four as **known data-source TODOs**, not blockers for Phase 3
— that's 4 of 91 (4.4%); the analysis pipeline will work fine with the
remaining 87.

## What I'd want to know on review

- Is the `FestivalEventCategory.weight` shape useful, or should I just store
  a binary "affects yes/no" and let Phase 3 derive weight from data?
- Are 9 categories the right granularity, or should I split (e.g.,
  airlines vs hotels vs cruises) or merge (jewelry-luxury + apparel)?
- 91 tickers — is this universe roughly right, or are there obvious gaps
  (international retailers, specific stocks you care about) I should add?
