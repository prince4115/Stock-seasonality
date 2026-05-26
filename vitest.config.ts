/**
 * Vitest config:
 *   - `@/` path alias (mirrors tsconfig — Next.js/TS handle this natively
 *     but vitest needs explicit config).
 *   - `dotenv/config` so tests that transitively import the Prisma client
 *     (via src/lib/prisma.ts) find DATABASE_URL. Pure-function tests don't
 *     need it, but rate-limit.ts imports the data layer for the DB-backed
 *     `checkRateLimit` helper.
 */
import "dotenv/config";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
