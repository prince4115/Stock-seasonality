#!/usr/bin/env tsx
/**
 * Phase 3 analysis CLI.
 *
 * Usage
 * -----
 *   npm run analyze                          # all active stocks, windows 5/10/15
 *   npm run analyze -- --ticker NKE          # one ticker (case-insensitive)
 *   npm run analyze -- --window 5            # one window only
 *   npm run analyze -- --include-delisted    # include TIF and friends
 *   npm run analyze -- --as-of 2024-12-31    # historical analysis as of a date
 *
 * Re-runnable: each stock's cached scores are replaced atomically, so
 * running the script twice produces the same DB state.
 */
import "dotenv/config";
import { runAnalysis } from "../src/lib/analysis/run";
import { prisma } from "../src/lib/prisma";

type ParsedArgs = {
  ticker?: string;
  windowYears?: number;
  includeDelisted?: boolean;
  asOf?: Date;
};

function usage(): never {
  console.log(
    "Usage: npm run analyze -- [--ticker SYMBOL] [--window 5|10|15] [--include-delisted] [--as-of YYYY-MM-DD]",
  );
  process.exit(0);
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const out: ParsedArgs = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--ticker":
        out.ticker = args[++i];
        if (!out.ticker) usage();
        break;
      case "--window": {
        const raw = args[++i];
        if (!raw) usage();
        const n = Number(raw.replace(/y$/i, ""));
        if (![5, 10, 15].includes(n)) {
          console.error(`--window must be 5, 10, or 15 (got "${raw}")`);
          process.exit(2);
        }
        out.windowYears = n;
        break;
      }
      case "--include-delisted":
        out.includeDelisted = true;
        break;
      case "--as-of": {
        const raw = args[++i];
        if (!raw) usage();
        const d = new Date(`${raw}T00:00:00Z`);
        if (Number.isNaN(d.getTime())) {
          console.error(`--as-of must be YYYY-MM-DD (got "${raw}")`);
          process.exit(2);
        }
        out.asOf = d;
        break;
      }
      case "--help":
      case "-h":
        usage();
        break;
      default:
        console.error(`Unknown flag: ${a}`);
        usage();
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  try {
    await runAnalysis(args);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  void prisma.$disconnect().finally(() => process.exit(1));
});
