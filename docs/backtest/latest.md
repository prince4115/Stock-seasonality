# Backtest report

Generated: 2026-06-10

## Configuration

| Parameter       | Value             |
| --------------- | ----------------- |
| Window          | 10y               |
| Top K           | 5                 |
| Min sample size | 5                 |
| Min % positive  | 60%               |
| Cost per side   | 10 bps            |
| Period          | 2017-01 → 2026-05 |

## Headline (strategy vs SPY buy-and-hold)

| Metric                | Strategy |     SPY |
| --------------------- | -------: | ------: |
| Total return          |   +48.2% | +238.8% |
| CAGR                  |    +4.3% |  +13.8% |
| Sharpe (rf=0)         |     0.29 |    0.88 |
| Max drawdown          |   −42.3% |  −24.6% |
| Hit rate (months > 0) |      50% |     69% |
| Months                |      113 |     113 |

Months invested: 113 · in cash: 0 · beat SPY in 45% of months

## Year by year (net)

| Year | Strategy |    SPY |
| ---- | -------: | -----: |
| 2017 |   +14.1% | +17.0% |
| 2018 |    +2.7% |  -5.2% |
| 2019 |   +29.2% | +32.2% |
| 2020 |    -6.0% | +13.5% |
| 2021 |    +1.4% | +23.1% |
| 2022 |   -23.0% | -20.6% |
| 2023 |   +23.4% | +22.3% |
| 2024 |   +38.1% | +27.8% |
| 2025 |    -6.3% | +21.9% |
| 2026 |   -16.3% |  +9.3% |

## Caveats

- Raw total returns; no market/factor adjustment. A bull market lifts both columns.
- Equal-weighted, full monthly turnover assumed; cost model is 10 bps per side, no slippage or market impact.
- Strategy thresholds were not optimized out-of-sample — treat results as descriptive, not predictive.
- Not investment advice. Past patterns do not guarantee future results.
