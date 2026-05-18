/**
 * Prisma client singleton.
 *
 * Prisma 7's `prisma-client` generator uses driver adapters — we bring our
 * own pg connection and Prisma wraps it. The adapter is constructed once,
 * stashed on globalThis in dev to survive HMR, and re-used across imports.
 *
 * Server-only — never import this from a "use client" component or from
 * code that ships to the browser.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
