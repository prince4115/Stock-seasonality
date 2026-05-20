# Phase 3 — Analysis engine (summary)

## What landed

**Pure-function analysis library** under `src/lib/analysis/`. No Prisma, no
I/O — all DB concerns live at the boundary in `run.ts`. Three modules,
three test files, **50 unit tests**.

| Module            | Exports                                                                                                                                          | Tests |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `types.ts`        | `PriceBar`, `SeasonalityOptions`, `MonthScore`, `EventWindowKind`, `EVENT_WINDOW_KINDS`, `EventScore`                                            | —     |
| `returns.ts`      | `pctReturn`, `monthKey`, `groupByMonth`, `monthlyReturn`, `sortBars`, `inDateRange`, `yearsBefore`, `isCovidYear`, `mean`, `fractionGreaterThan` | 26    |
| `seasonality.ts`  | `filterToWindow`, `monthlyReturnsByMonthKey`, `computeSeasonality`                                                                               | 15    |
| `event-window.ts` | `indexAtOrAfter`, `eventWindowReturn`, `aggregateEventWindow`                                                                                    | 13    |

Vitest set up with `npm test` and `npm run test:watch`. No vite.config — vitest
picks up `*.test.ts` files via convention.

**DB orchestrator** — `src/lib/analysis/run.ts`. For each stock:

1. Fetch all `PriceHistory` bars (sorted).
2. For each `(windowYears, excludeCovid)`: build 12 `SeasonalityScore` rows.
3. For each `(festivalSlug, EventWindowKind, excludeCovid)`: build one `EventWindowScore` row.
4. Atomic `prisma.$transaction([deleteMany, createMany, deleteMany, createMany])`. ~4 SQL round-trips per stock instead of ~150 individual upserts. Idempotent.

**CLI** — `scripts/compute-analysis.ts` with flags:

```bash
npm run analyze                        # all active stocks, windows 5/10/15
npm run analyze -- --ticker NKE        # one ticker
npm run analyze -- --window 5          # one window
npm run analyze -- --include-delisted  # include TIF
npm run analyze -- --as-of 2024-12-31  # historical analysis as of a date
```

**Schema addition** — `EventWindowScore` model + Postgres enum `EventWindowKind`
(`PRE30_PRE7` / `PRE7_EVENT` / `EVENT_POST7`). Migration
`20260520220214_add_event_window_score` applied. Brief listed 6 models; this is
the 7th, justified by the brief's own "cache all results in DB; never
recompute on a page request" requirement — event-window scores need somewhere
to live and stuffing them into `SeasonalityScore` would force ugly nullable
columns.

## Verification

- **`npm test`**: 50 tests across 3 files, all green (~700 ms cold).
- **`npm run lint`**: clean.
- **`npm run build`**: clean. Type-checks the new analysis lib + run.ts + CLI.
- **`npm run format:check`**: clean.
- **`npm run analyze -- --ticker NKE`**: 72 seasonality + 102 event-window rows in 1.3s — matches the math (12 months × 3 windows × 2 toggles = 72; 17 festival slugs × 3 kinds × 2 toggles = 102).
- **`npm run analyze` (full)**: 84 stocks processed in 29.5s, **6,048 SeasonalityScore + 8,568 EventWindowScore** rows written to Supabase. 6 skipped (no price data — see follow-ups).

Sanity-checked NKE January seasonality across 5y/10y/15y from the DB directly:

```
NKE | window | month | avgReturn  | %positive | n
    |  5y    |     1 | -0.0110   | 0.40      | 5
    | 10y    |     1 | +0.0039   | 0.50      | 10
    | 15y    |     1 | +0.0043   | 0.53      | 15
    |  5y    |     7 | +0.0399   | 0.80      | 5
    | 10y    |     7 | +0.0195   | 0.70      | 10
    | 15y    |     7 | +0.0186   | 0.67      | 15
```

Numbers move in plausible directions across window lengths — sample size and
direction match expected behavior for a consumer-discretionary name.

## Decisions worth flagging

1. **`pctYearsBeatMean` compares against the _overall_ window mean**, not a
   per-month or per-season reference. Per-month would be self-referential
   (each month beats its own mean ~50% of the time by definition). This
   matches the brief's "% of years a month was positive AND beat the stock's
   overall mean". The "AND" combination is left to the consumer; we store
   the two atoms separately so the API/UI can multiply, AND-combine, or
   display both alongside sample size.
2. **Event-window offsets are trading days**, not calendar days. yfinance
   only returns trading days, so indexing into the sorted bars array
   naturally skips weekends/holidays. When an event falls on a non-trading
   day (e.g., Christmas on a Sunday), we anchor at the first bar on/after
   the event date — the typical event-study convention.
3. **Vitest, not Jest or `node:test`**. Vitest is zero-config, runs `.test.ts`
   directly, and has good DX. Jest needs heavier config; `node:test`
   requires tsx-loader and worse error formatting.
4. **TypeScript target bumped to es2022.** Was implicit es5; that doesn't
   permit `for…of` over a `Map`. es2022 is widely supported and matches the
   runtime we actually deploy to (Vercel Edge / Node 22).
5. **No combined "seasonality strength score" column.** Could add one later
   (`pctYearsPositive * pctYearsBeatMean` or `AND` count), but keeping the
   atoms separate gives the UI flexibility to show "12% avg, 60% positive,
   n=10" instead of one opaque number — which the brief explicitly calls
   for ("Always show sample size and confidence next to any percentage").

## Risks / follow-ups for Phase 4+

- **6 active tickers had zero ingested bars** and got skipped. All are
  real-world ticker churn:

  | Ticker | Reason                                                                    |
  | ------ | ------------------------------------------------------------------------- |
  | PARA   | Paramount Global → Skydance merger Aug 2025, ticker transition            |
  | SEAS   | United Parks & Resorts — yfinance gap; should be queryable, needs digging |
  | SIX    | Six Flags + Cedar Fair merger Jul 2024 → new ticker `FUN`                 |
  | GPS    | Gap Inc. — ticker change. yfinance returns no 15y history under "GPS"     |
  | JWN    | Nordstrom — went private Dec 2024 via Nordstrom family + Liverpool        |
  | K      | Kellogg split Oct 2023; ticker `K` is now Kellanova. yfinance gap         |

  Three of these (JWN, GPS, K) weren't on Phase 2's known-issues list — they
  surfaced when the analysis loop discovered they had zero `PriceHistory`
  rows. Action: backfill via Polygon.io when we swap data sources, or mark
  them `delisted` with an appropriate `delistedAt` in the seed.

- **No backtest preview yet.** The brief says "/stock/[ticker] —
  seasonality fingerprint, event-window table, and backtest preview". This
  phase covers the first two. Backtest preview (e.g., "if you bought NKE
  every July 1 from 2014, here's your IRR") is a Phase 5 frontend feature.
- **Survivorship handling is correct but partial.** `delisted=true` rows
  stay in the universe. Phase 4 query layer needs to filter analysis output
  by whether the stock had data within the requested window — e.g., TIF's
  hypothetical scores wouldn't be meaningful for a 5y window ending 2026
  since it delisted in 2021. Easy filter at the API layer; flagged here for
  Phase 4 to wire up.
- **No FX awareness.** ADRs (LVMUY, CFRUY, BURBY, PRDSY) compute returns in
  their listed currency (USD for ADRs but reflecting EUR/GBP underlying). A
  Diwali run-up in LVMUY mixes the stock's move with the EUR/USD move,
  which can be material over multi-week windows. Not blocking Phase 4 but
  worth a paragraph on the About page.

## How to re-run

```bash
# from stock-seasonality/

# unit tests
npm test
npm run test:watch    # while developing

# full analysis (idempotent)
npm run analyze

# one ticker
npm run analyze -- --ticker NKE

# subset of windows
npm run analyze -- --window 5
```

## What I'd want to know on review

- Is the **trading-day vs calendar-day** choice right for event windows?
  The brief writes "(T-30, T-7)" — could go either way; I picked trading
  days because (a) it's the event-study convention, and (b) the data
  granularity (one bar per trading day) makes it the natural index. Easy to
  add a calendar-day variant if you'd rather.
- For the **6 skipped tickers**, should I (a) keep them as-is and document
  the gap, (b) replace with current tickers (FUN for SIX, etc.) and lose
  the pre-merger history, or (c) mark them `delisted` so they don't pollute
  Phase 5's active universe?
- The **7th model (EventWindowScore)** — green light, or would you rather
  see it merged into `SeasonalityScore` somehow? I think the separation
  pays off in Phase 4 query simplicity, but it's a deliberate departure from
  your "6 models" list.

Say **"go Phase 4"** when ready — API routes are next.
