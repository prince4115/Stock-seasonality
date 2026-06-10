# Backtest report

Generated: 2026-06-10

## Configuration

| Parameter       | Value             |
| --------------- | ----------------- |
| Window          | 10y               |
| Top K           | 88                |
| Min sample size | 1                 |
| Min % positive  | 0%                |
| Cost per side   | 0 bps             |
| Period          | 2017-01 → 2026-05 |

## Headline (strategy vs SPY buy-and-hold)

| Metric                | Strategy |     SPY |
| --------------------- | -------: | ------: |
| Total return          |  +165.6% | +238.8% |
| CAGR                  |   +10.9% |  +13.8% |
| Sharpe (rf=0)         |     0.58 |    0.88 |
| Max drawdown          |   −37.2% |  −24.6% |
| Hit rate (months > 0) |      60% |     69% |
| Months                |      113 |     113 |

Months invested: 113 · in cash: 0 · beat SPY in 49% of months

## Year by year (net)

| Year | Strategy |    SPY |
| ---- | -------: | -----: |
| 2017 |   +16.9% | +17.0% |
| 2018 |    -1.0% |  -5.2% |
| 2019 |   +30.2% | +32.2% |
| 2020 |   +18.3% | +13.5% |
| 2021 |   +32.5% | +23.1% |
| 2022 |   -19.3% | -20.6% |
| 2023 |   +19.4% | +22.3% |
| 2024 |   +14.5% | +27.8% |
| 2025 |    +6.7% | +21.9% |
| 2026 |    -4.5% |  +9.3% |

## Caveats

- Raw total returns; no market/factor adjustment. A bull market lifts both columns.
- Equal-weighted, full monthly turnover assumed; cost model is 0 bps per side, no slippage or market impact.
- Strategy thresholds were not optimized out-of-sample — treat results as descriptive, not predictive.
- Not investment advice. Past patterns do not guarantee future results.
