# Backtest report

Generated: 2026-06-10

## Configuration

| Parameter       | Value             |
| --------------- | ----------------- |
| Window          | 10y               |
| Top K           | 5                 |
| Min sample size | 8                 |
| Min % positive  | 70%               |
| Cost per side   | 10 bps            |
| Period          | 2017-01 → 2026-05 |

## Headline (strategy vs SPY buy-and-hold)

| Metric                | Strategy |     SPY |
| --------------------- | -------: | ------: |
| Total return          |   -28.0% | +238.8% |
| CAGR                  |    -3.4% |  +13.8% |
| Sharpe (rf=0)         |    -0.02 |    0.88 |
| Max drawdown          |   −51.6% |  −24.6% |
| Hit rate (months > 0) |      38% |     69% |
| Months                |      113 |     113 |

Months invested: 85 · in cash: 28 · beat SPY in 34% of months

## Year by year (net)

| Year | Strategy |    SPY |
| ---- | -------: | -----: |
| 2017 |    +0.0% | +17.0% |
| 2018 |    +0.0% |  -5.2% |
| 2019 |    +4.1% | +32.2% |
| 2020 |   -13.9% | +13.5% |
| 2021 |    +9.7% | +23.1% |
| 2022 |   -47.2% | -20.6% |
| 2023 |   +59.1% | +22.3% |
| 2024 |   +18.2% | +27.8% |
| 2025 |   -18.1% | +21.9% |
| 2026 |   -10.0% |  +9.3% |

## Caveats

- Raw total returns; no market/factor adjustment. A bull market lifts both columns.
- Equal-weighted, full monthly turnover assumed; cost model is 10 bps per side, no slippage or market impact.
- Strategy thresholds were not optimized out-of-sample — treat results as descriptive, not predictive.
- Not investment advice. Past patterns do not guarantee future results.
