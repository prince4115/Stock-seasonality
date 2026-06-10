# Stock Seasonality Analyzer

A reproducible, open-source web application for **descriptive analysis of
calendar and event-window seasonality in consumer-spending equities**. The
system ingests ~15 years of daily OHLCV data for ~90 hand-curated tickers,
computes cached seasonality and event-window statistics, and serves them
through a server-rendered web interface where every percentage is reported
alongside its underlying sample size.

> **Not investment advice.** This is a research and educational tool. Past
> patterns do not guarantee future results.

---

## What's inside

- **9 consumer-spending categories** (travel, retail, food, restaurants,
  apparel, jewelry, cinema, toys, beauty).
- **89 active + 6 delisted tickers**, with proper survivorship handling
  (delisted tickers stay in the historical record with a flag).
- **~303,000 daily OHLCV bars** ingested from Yahoo Finance.
- **374 festival occurrences** (2010–2031) — Christmas, Thanksgiving,
  Black Friday, Diwali, Chinese New Year, Easter, Super Bowl, and more.
- **~15,000 cached seasonality + event-window scores** across 5y / 10y /
  15y windows with a COVID-exclusion toggle.
- **66 unit tests** for the pure-function analysis library.
- **Mobile-friendly UI** with colorblind-safe diverging blue↔orange
  heatmaps, server-rendered SVG sparklines, and sample size on every
  number.

## Quick start

Prerequisites: Node 22+, Python 3.12+, PostgreSQL (Supabase or local).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env to point DATABASE_URL at your Postgres instance

# 3. Apply schema migrations
npx prisma migrate dev

# 4. Seed the universe (categories, stocks, festivals)
npm run db:seed

# 5. Set up Python ingestion
python -m venv .venv
.venv\Scripts\activate          # Windows
# or: source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt

# 6. Backfill 15 years of daily prices (~90 seconds)
python ingest_prices.py --window 15y --include-delisted

# 7. Compute seasonality + event-window scores (~30 seconds)
npm run analyze

# 8. Run tests
npm test

# 9. Start the dev server
npm run dev    # → http://localhost:3000
```

## Project structure

```
stock-seasonality/
├── prisma/
│   ├── schema.prisma           — 7 models + Postgres enum
│   ├── seeds/                  — categories, stocks, festivals (TypeScript)
│   └── migrations/
├── src/
│   ├── app/                    — Next.js 14 App Router pages + API routes
│   ├── lib/
│   │   ├── analysis/           — pure-function analysis library + 50 tests
│   │   ├── data/               — Prisma wrappers used by pages and routes
│   │   ├── prisma.ts           — Prisma client singleton (driver-adapter)
│   │   ├── colors.ts           — diverging blue↔orange palette
│   │   ├── http-cache.ts       — CDN cache-control constants
│   │   └── rate-limit.ts       — waitlist rate limiting + 16 tests
│   └── components/             — UI primitives (Heatmap, Sparkline, etc.)
├── scripts/
│   └── compute-analysis.ts     — CLI: npm run analyze
├── ingest_prices.py            — Python: yfinance → PostgreSQL
├── requirements.txt            — Python deps
├── .github/workflows/          — daily refresh cron
└── docs/
    ├── paper.md                — long-form system paper (~5,400 words)
    ├── paper.docx              — Word version of the same
    └── joss/                   — JOSS submission paper + bibliography
```

## Methodology

Three short bullets; the long-form treatment lives in
[`docs/paper.md`](docs/paper.md):

- **Monthly seasonality.** For each (stock, month, window), we compute
  the arithmetic mean monthly return, the fraction of years positive, the
  fraction beating the stock's overall mean monthly return, and the
  sample size. All returns use adjusted close (split- and
  dividend-adjusted) and are computed first-bar-to-last-bar within each
  calendar month.
- **Event-window returns.** For each festival occurrence we compute
  returns over three trading-day windows: T−30 to T−7, T−7 to T, T to
  T+7. Per-festival weights on the category link table let Phase 3 scale
  category-level event effects.
- **Survivorship.** Delisted tickers stay in the schema with `delisted =
true` and `delistedAt = <date>` so historical analyses are not silently
  flattered by dropping failures (Brown, Goetzmann, Ibbotson, & Ross,
  1992). Cached score rows are only emitted when `sampleSize > 0`.

We deliberately use deterministic descriptive statistics rather than
machine learning given the small per-cell sample sizes (n = 5 to 15). See
`docs/paper.md` §4.4 for the full rationale.

## Architecture

- **Next.js 14** (App Router) — server-rendered pages, API routes, one
  client component (the analysis controls).
- **PostgreSQL** via Supabase — pooled session-mode connection.
- **Prisma 7** ORM with the `prisma-client` (driver-adapter) generator
  and `@prisma/adapter-pg`.
- **Python 3.12+** for the daily ingestion job (yfinance + psycopg).
- **Vitest** for unit tests (66 passing).
- **Plausible** for analytics (no-op without `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`).
- **GitHub Actions** for the daily cron.

## Citing this software

If you use this project in academic work, please cite the accompanying
JOSS paper (citation will be added once published; meanwhile use the
GitHub URL).

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

This tool is for educational and research purposes only. Nothing here is
investment advice, a solicitation, or a recommendation to buy or sell
any security. Past performance does not guarantee future results.
Consult a qualified financial advisor before making any investment
decision.
