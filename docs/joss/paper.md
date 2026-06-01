---
title: 'Stock Seasonality Analyzer: A Reproducible, Survivorship-Aware Framework for Calendar and Event-Window Analysis of Consumer-Spending Equities'
tags:
  - finance
  - quantitative finance
  - stock market
  - seasonality
  - event study
  - survivorship bias
  - TypeScript
  - Python
  - Next.js
  - PostgreSQL
authors:
  - name: Prince Verma
    orcid: 0000-0000-0000-0000
    affiliation: 1
affiliations:
  - name: Independent researcher
    index: 1
date: 1 June 2026
bibliography: paper.bib
---

# Summary

Calendar effects in equity returns — the January effect [@rozeff1976],
the "Halloween indicator" [@bouman2002], turn-of-the-month and
holiday-driven anomalies [@lakonishok1988] — have been well-documented
for decades. Practitioner tooling for analyzing these effects, however,
is concentrated in expensive commercial products (Bloomberg, FactSet,
Seasonax), making transparent methodological scrutiny difficult for
students, educators, and independent researchers.

**Stock Seasonality Analyzer** is an open-source web application that
computes and visualizes monthly seasonality and festival-window returns
for a curated universe of consumer-spending equities over a 15-year
trailing window. The system ingests approximately 303,000 daily
adjusted-close bars across 89 active and 6 delisted tickers, computes
about 15,000 cached seasonality and event-window statistics, and serves
them through a server-rendered web interface where every percentage is
reported alongside its underlying sample size. Survivorship bias
[@brown1992survivorship] is handled at the schema level: delisted
tickers remain in the historical record with a flag rather than being
silently dropped. Returns are aggregated using trading-day offsets in
the event-study convention [@brown1985; @mackinlay1997].

The software is implemented as a Next.js 14 monolith backed by
PostgreSQL, with a satellite Python ingestion job scheduled via GitHub
Actions. A pure-function analysis library (TypeScript) with 50 unit
tests computes returns, seasonality scores, and event-window
aggregations; an additional 16 tests cover the rate-limiting layer for
the waitlist signup endpoint. All cached scores are deterministic given
the same input price data, making the analysis reproducible end-to-end.

# Statement of need

Existing seasonality analysis tools fall into two categories. Commercial
platforms — Bloomberg Terminal, FactSet, and dedicated seasonality
dashboards such as Seasonax and Equity Clock — are powerful but
opaque: their data sources are not always disclosed, their computational
methods are rarely documented, and their licensing fees place them out
of reach for educational use or independent research. At the other end,
do-it-yourself Python notebooks circulate widely in quantitative-finance
education but typically (a) ignore survivorship bias, (b) lack unit
tests on the return math, (c) provide no caching strategy, and (d) hide
sample-size information that would let a reader judge whether a reported
percentage is meaningful.

`stock-seasonality` fills this gap by providing a complete, reproducible
system designed for educational and methodological transparency:

1. **Survivorship-aware data ingestion.** Delisted tickers are first-class
   schema entities. A 10-year backtest of consumer-retail seasonality in
   October cannot be silently flattered by dropping failures.
2. **Deterministic descriptive statistics over ML.** Given small per-cell
   sample sizes (n = 5 to 15 years), classical machine-learning estimators
   would overfit. The system deliberately uses arithmetic means and
   fractions, and surfaces `n` alongside every reported percentage.
3. **Aggressive caching.** Scores are computed once per data refresh and
   read from PostgreSQL on every subsequent request. Pages never
   recompute analysis values, matching the user-facing requirement that
   historical seasonality does not change minute to minute.
4. **End-to-end reproducibility.** A nine-step recipe in the project README
   reproduces every reported percentage from a clean clone of the
   repository.

The system is intended for: (a) finance and economics courses that teach
seasonality and event-study methodology; (b) independent researchers
who want a transparent baseline against which to compare proprietary
tools; and (c) software-engineering case studies of statistically-honest
financial tooling.

# Methodology

For a stock $s$, an integer trailing-window length $W \in \{5, 10, 15\}$
years, and a COVID-exclusion flag $c \in \{\text{false}, \text{true}\}$,
let $r(s, y, m)$ denote the monthly return computed as the
first-bar-to-last-bar percent change in adjusted close within calendar
month $m$ of year $y$. The seasonality score for $(s, m, W, c)$
comprises:

- **avgReturn**: arithmetic mean of $r(s, y, m)$ over years $y$ in the
  window;
- **pctYearsPositive**: fraction of years with $r(s, y, m) > 0$;
- **pctYearsBeatMean**: fraction of years exceeding the stock's overall
  mean monthly return in the same window;
- **sampleSize**: count of contributing years.

For festival occurrences $E = \{e_1, \dots, e_n\}$ of a recurring event
(e.g., the 22 Diwali dates 2010–2031), event-window returns are computed
over three trading-day windows relative to the anchor date — $[T-30,
T-7]$, $[T-7, T]$, $[T, T+7]$ — and aggregated across occurrences
[@heston2008]. When an event date falls on a non-trading day, the anchor
is the first subsequent trading day [@brown1985].

# Software design

The system is layered to keep pure analytical logic separate from I/O:

- The **analysis library** (TypeScript, `src/lib/analysis/`) contains
  the pure return-math, seasonality, and event-window functions. No
  database access, no HTTP. Fifty unit tests guard correctness against
  synthetic price series with known properties.
- The **orchestrator** (`src/lib/analysis/run.ts`) reads `PriceHistory`
  rows from Prisma, runs the pure functions, and atomically replaces
  cached scores via a `deleteMany` + `createMany` transaction. Per-stock
  scope ensures idempotency.
- The **API and page layer** (`src/app/api/`, `src/app/`) reads cached
  scores through a thin `src/lib/data/` wrapper. Pages are server-rendered;
  no compute occurs on the request path.
- The **ingestion job** (`ingest_prices.py`) pulls daily OHLCV from
  Yahoo Finance via `yfinance`, normalizes NaN bars and partial
  responses, and upserts via `psycopg` with `ON CONFLICT DO UPDATE`.

# Acknowledgments

Software-engineering work was completed end-to-end over six iterative
phases with continuous human direction. Code generation was assisted by
Anthropic's Claude AI; methodological and design decisions are the
author's responsibility. The author thanks the maintainers of `Next.js`,
`Prisma`, `yfinance`, `psycopg`, and `Vitest` for the open-source
foundations that made this work feasible.

# References
