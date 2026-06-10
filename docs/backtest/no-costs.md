# Backtest report

Generated: 2026-06-10

## Configuration

| Parameter       | Value             |
| --------------- | ----------------- |
| Window          | 10y               |
| Top K           | 5                 |
| Min sample size | 5                 |
| Min % positive  | 60%               |
| Cost per side   | 0 bps             |
| Period          | 2017-01 → 2026-05 |

## Headline (strategy vs SPY buy-and-hold)

| Metric                | Strategy |     SPY |
| --------------------- | -------: | ------: |
| Total return          |   +85.8% | +238.8% |
| CAGR                  |    +6.8% |  +13.8% |
| Sharpe (rf=0)         |     0.37 |    0.88 |
| Max drawdown          |   −40.4% |  −24.6% |
| Hit rate (months > 0) |      50% |     69% |
| Months                |      113 |     113 |

Months invested: 113 · in cash: 0 · beat SPY in 45% of months

## Year by year (net)

| Year | Strategy |    SPY |
| ---- | -------: | -----: |
| 2017 |   +16.8% | +17.0% |
| 2018 |    +5.2% |  -5.2% |
| 2019 |   +32.3% | +32.2% |
| 2020 |    -3.7% | +13.5% |
| 2021 |    +3.8% | +23.1% |
| 2022 |   -21.1% | -20.6% |
| 2023 |   +26.3% | +22.3% |
| 2024 |   +41.4% | +27.8% |
| 2025 |    -4.0% | +21.9% |
| 2026 |   -15.5% |  +9.3% |

## Caveats

- Raw total returns; no market/factor adjustment. A bull market lifts both columns.
- Equal-weighted, full monthly turnover assumed; cost model is 0 bps per side, no slippage or market impact.
- Strategy thresholds were not optimized out-of-sample — treat results as descriptive, not predictive.
- Not investment advice. Past patterns do not guarantee future results.
