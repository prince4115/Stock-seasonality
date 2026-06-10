# Phase 7 — Backtest engine (summary)

## The question this phase existed to answer

Before building the autonomous "pick stocks weekly" autopilot (the
post-Phase-6 pivot), validate the underlying strategy: **if we had traded
the seasonality rules every month for the last ~9.4 years — using only the
data available at each decision point — would we have beaten just buying
SPY?**

## The answer: no. Decisively.

Default configuration (10y scoring window, top-5 equal-weighted monthly,
n≥5 and ≥60% positive-years gates, 10 bps/side costs, 2017-01 → 2026-05):

| Metric                |   Strategy | SPY buy-and-hold |
| --------------------- | ---------: | ---------------: |
| Total return          |     +48.2% |      **+238.8%** |
| CAGR                  |      +4.3% |       **+13.8%** |
| Sharpe (rf=0)         |       0.29 |         **0.88** |
| Max drawdown          | **−42.3%** |           −24.6% |
| Hit rate (months > 0) |        50% |              69% |
| Months beating SPY    |        45% |                — |

Lower return, higher risk, deeper drawdowns. There is no configuration in
the sensitivity grid that changes the conclusion.

## Sensitivity analysis — why it fails

| Variant                                            |       Total |   CAGR | Sharpe | Max DD | What it tells us                                                                                    |
| -------------------------------------------------- | ----------: | -----: | -----: | -----: | --------------------------------------------------------------------------------------------------- |
| Default (k=5, 10 bps)                              |      +48.2% |  +4.3% |   0.29 | −42.3% | baseline                                                                                            |
| **Zero costs**                                     |      +85.8% |  +6.8% |   0.37 | −40.4% | Costs hurt (~38pp over the period) but are not the story — even free trading loses to SPY by ~150pp |
| Concentrated (k=3)                                 |      +42.9% |  +3.9% |   0.27 | −56.2% | Concentration adds risk, not return                                                                 |
| Diversified (k=10)                                 |      +91.6% |  +7.1% |   0.41 | −37.6% | More diversification → closer to the universe average, still far behind SPY                         |
| **Strict gates (n≥8, ≥70% positive)**              |  **−28.0%** |  −3.4% |  −0.02 | −51.6% | The "highest-conviction" seasonal patterns did the _worst_. Smoking gun.                            |
| Short memory (5y window)                           |      +45.9% |  +4.1% |   0.28 | −48.9% | Not a window-length artifact                                                                        |
| **Universe equal-weight (no selection, no costs)** | **+165.6%** | +10.9% |   0.58 | −37.2% | The decomposition key — see below                                                                   |

### Decomposition of the underperformance

```
SPY buy-and-hold                          +238.8%
  └─ universe composition cost  (−73pp)
Universe equal-weight, no selection       +165.6%
  └─ seasonality selection cost (−80pp)
Strategy, no costs                         +85.8%
  └─ transaction costs          (−38pp)
Strategy as specified                      +48.2%
```

Two independent problems:

1. **Universe composition.** Consumer-spending equities (retail, apparel,
   cinema, food) simply lagged the tech-heavy S&P 500 over 2017–2026 by
   ~73pp. No stock-picking rule inside this universe could have closed
   that gap.
2. **The seasonality signal is _negative_ within its own universe.**
   Picking the seasonally-best 5 stocks each month roughly _halved_ the
   return of naively holding all 88. The strict-gates variant makes the
   mechanism visible: the more reliably positive a (stock, month) looked
   in-sample, the worse it did out-of-sample. With n ≤ 15 samples per
   cell, the top-ranked patterns are substantially noise — and noise
   mean-reverts. This is consistent with the anomaly-decay literature
   (McLean & Pontiff, 2016: anomalies decay ~50%+ post-publication) and
   with our own paper's §4.4 argument for why n≤15 can't support
   prediction.

## What was built (and stays useful)

- **`src/lib/backtest/`** — pure walk-forward engine: `months.ts`,
  `metrics.ts` (total/CAGR/Sharpe/maxDD/hit-rate), `strategy.ts`
  (as-of ranking with eligibility gates), `engine.ts` (equal-weight
  top-K, round-trip costs, cash months, delisting-gap handling).
  **29 new unit tests; 95 total, all green.**
- **No-lookahead enforced by construction and proven by test**: a stock
  with five straight +10% Julys whose traded July crashes −50% is still
  picked and eats the crash.
- **`npm run backtest`** CLI with `--window/--top-k/--min-n/--min-pos/
--cost-bps/--start/--end/--out`; writes a markdown + JSON report.
- **Reports** for all seven runs in `docs/backtest/`.
- **SPY benchmark plumbing**: hidden `benchmark` category, excluded from
  all public listings; SPY ingested (3,772 daily bars).

## Verification

- `npm test` — 95/95.
- `npm run lint` / `format:check` / `build` — clean (build verified after
  Supabase restore; the earlier sitemap failure was the paused DB).
- Engine results tie out with displayed seasonality scores by
  construction (same first-bar→last-bar monthly return definition).

## Consequence for the pivot (decision needed)

The agreed plan was Phase 7 backtest → Phase 8 automation → Phase 9
signal engine → Phase 10 autopilot dashboard. The backtest was the
go/no-go gate for Phases 9–10, and the evidence says **no-go for the
strategy as designed**: automating it would automate value destruction,
even with demo money it would just demonstrate failure slowly.

Three honest paths forward:

1. **Accept the negative result (recommended).** Build Phase 8
   (automation — daily ingest + weekly analyze cron) which has standalone
   value for the research product, and publish the negative finding as a
   new section of the paper. "We built the measurement tool, then tested
   tradability: the patterns are not tradable, consistent with
   anomaly-decay literature" is a _stronger_ research contribution than
   the tool alone, and it differentiates the project from every
   seasonality dashboard that implies otherwise.
2. **Iterate on the strategy and re-test** — e.g., market-relative
   scoring (pick stocks seasonally strong _relative to SPY_), event-window
   entries instead of calendar months, long the universe in strong months
   / cash in weak ones. Caveat stated up front: every iteration evaluated
   against the same 9 years erodes the validity of the test (overfitting
   by iteration), and the strict-gates result suggests the core signal is
   noise. Expectations should be low.
3. **Build the autopilot anyway as an educational feature** — virtual
   portfolio with the negative backtest disclosed prominently ("watch
   what following seasonal patterns actually does"). Pedagogically
   interesting; not what the pivot intended.

Stopping here for review per the phase gates.
