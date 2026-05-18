#!/usr/bin/env python3
"""
Pull daily OHLCV from yfinance and upsert into Stock-Seasonality's
PriceHistory table.

Reads the ticker universe from the Stock table (populated by `npm run db:seed`)
and writes batched upserts via psycopg. Per-ticker commits so a single bad
symbol doesn't lose progress for the rest.

Examples
--------
  python ingest_prices.py                              # all active, 15y
  python ingest_prices.py --ticker AAPL --window 5y    # one ticker, 5y
  python ingest_prices.py --window 5d                  # daily cron mode
  python ingest_prices.py --include-delisted           # incl. TIF etc.
  python ingest_prices.py --dry-run                    # no writes, just counts

Environment
-----------
DIRECT_URL or DATABASE_URL from .env. Prefer DIRECT_URL (port 5432) if both
are set — the Supabase pooler can choke on long-running bulk inserts.
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Iterable, Iterator, List, Optional, Tuple

import cuid
import pandas as pd
import psycopg
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="[ingest] %(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ingest")

DATABASE_URL = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--ticker", help="Ingest only this ticker (e.g., AAPL).")
    p.add_argument(
        "--window",
        default="15y",
        help="yfinance period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max). Default 15y.",
    )
    p.add_argument(
        "--include-delisted",
        action="store_true",
        help="Also pull tickers marked delisted in the Stock table.",
    )
    p.add_argument(
        "--batch-size",
        type=int,
        default=2000,
        help="Rows per psycopg executemany batch. Default 2000.",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't write to the DB; just log what would happen.",
    )
    return p.parse_args()


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def fetch_stocks(
    conn: "psycopg.Connection",
    ticker_filter: Optional[str],
    include_delisted: bool,
) -> List[Tuple[str, str, bool]]:
    sql = 'SELECT id, ticker, delisted FROM "Stock"'
    where: List[str] = []
    params: List[object] = []
    if ticker_filter:
        where.append("ticker = %s")
        params.append(ticker_filter.upper())
    if not include_delisted:
        where.append("delisted = false")
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY ticker"
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return list(cur.fetchall())


UPSERT_SQL = """
INSERT INTO "PriceHistory"
  (id, "stockId", date, open, high, low, close, "adjClose", volume, source)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT ("stockId", date) DO UPDATE SET
  open      = EXCLUDED.open,
  high      = EXCLUDED.high,
  low       = EXCLUDED.low,
  close     = EXCLUDED.close,
  "adjClose"= EXCLUDED."adjClose",
  volume    = EXCLUDED.volume,
  source    = EXCLUDED.source
"""


# ---------------------------------------------------------------------------
# yfinance pull
# ---------------------------------------------------------------------------
def pull_history(ticker: str, window: str) -> List[dict]:
    """
    Pull OHLCV for one ticker. Returns a list of dicts in chronological
    order. Skips rows with NaN in any price field (yfinance occasionally
    returns partial bars).
    """
    df = yf.download(
        ticker,
        period=window,
        auto_adjust=False,
        progress=False,
        threads=False,
    )
    if df is None or df.empty:
        return []

    # When yfinance returns a MultiIndex on the columns axis (which it does
    # for some versions/single-ticker calls), flatten by taking the first
    # level — "Open" / "High" / "Adj Close" / etc.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    rows: List[dict] = []
    for ts, row in df.iterrows():
        # ts is a pandas Timestamp; we want a date object for @db.Date.
        try:
            d = ts.date()
        except AttributeError:
            d = ts  # already a date

        rec = {
            "date": d,
            "open": _as_float(row.get("Open")),
            "high": _as_float(row.get("High")),
            "low": _as_float(row.get("Low")),
            "close": _as_float(row.get("Close")),
            "adj_close": _as_float(row.get("Adj Close")),
            "volume": _as_int(row.get("Volume")),
        }
        if any(rec[k] is None for k in ("open", "high", "low", "close", "adj_close")):
            continue
        rows.append(rec)
    return rows


def _as_float(v) -> Optional[float]:
    if v is None or pd.isna(v):
        return None
    return float(v)


def _as_int(v) -> int:
    if v is None or pd.isna(v):
        return 0
    return int(v)


# ---------------------------------------------------------------------------
# Upsert
# ---------------------------------------------------------------------------
def _chunks(seq: List[tuple], size: int) -> Iterator[List[tuple]]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def upsert_rows(
    conn: "psycopg.Connection",
    stock_id: str,
    rows: Iterable[dict],
    batch_size: int,
    dry_run: bool,
) -> int:
    tuples = [
        (
            cuid.cuid(),
            stock_id,
            r["date"],
            r["open"],
            r["high"],
            r["low"],
            r["close"],
            r["adj_close"],
            r["volume"],
            "yfinance",
        )
        for r in rows
    ]
    if dry_run:
        return len(tuples)

    written = 0
    with conn.cursor() as cur:
        for batch in _chunks(tuples, batch_size):
            cur.executemany(UPSERT_SQL, batch)
            written += len(batch)
    return written


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    args = parse_args()

    if not DATABASE_URL:
        log.error("DIRECT_URL or DATABASE_URL must be set in .env")
        return 2

    with psycopg.connect(DATABASE_URL, autocommit=False) as conn:
        stocks = fetch_stocks(conn, args.ticker, args.include_delisted)
        if not stocks:
            log.warning("no stocks matched filter — run `npm run db:seed` first?")
            return 1

        log.info(
            "ingesting %d ticker(s) window=%s dry_run=%s",
            len(stocks),
            args.window,
            args.dry_run,
        )

        total_rows = 0
        for stock_id, ticker, delisted in stocks:
            tag = " [DELISTED]" if delisted else ""
            try:
                rows = pull_history(ticker, args.window)
            except Exception as e:
                log.warning("  ! %s%s — yfinance error: %s", ticker, tag, e)
                continue
            if not rows:
                log.info("  - %s%s — no data returned", ticker, tag)
                continue

            try:
                n = upsert_rows(conn, stock_id, rows, args.batch_size, args.dry_run)
            except Exception as e:
                log.error("  ! %s%s — db error: %s", ticker, tag, e)
                conn.rollback()
                continue

            if not args.dry_run:
                conn.commit()
            log.info(
                "  + %s%s — %s%d rows",
                ticker,
                tag,
                "would upsert " if args.dry_run else "",
                n,
            )
            total_rows += n

        log.info("done — %d total rows across %d tickers", total_rows, len(stocks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
