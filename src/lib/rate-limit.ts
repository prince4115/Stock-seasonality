/**
 * Rate-limiting helpers for /api/waitlist.
 *
 * IP hashing: HMAC-SHA256 of the IP with a secret salt from
 * RATE_LIMIT_SALT (falls back to a constant for dev). We never store raw
 * IPs — only the hash lands in WaitlistSignup.ipHash.
 *
 * Rate-limit policy is intentionally split into "decide" (pure) and
 * "check" (DB-backed) so the policy is unit-testable without mocking
 * Prisma.
 */
import { createHmac } from "node:crypto";
import { countRecentSignupsByIp } from "@/lib/data/waitlist";

// "Looks like an email" — not RFC-perfect, sufficient for waitlist signups.
// Local-part: any chars except whitespace/@. Domain: same, must have a dot.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_RE.test(trimmed);
}

/**
 * Pull the best-effort client IP from request headers. Vercel/Cloudflare
 * set `x-forwarded-for`; fall back to `x-real-ip`; finally empty string.
 * The first IP in `x-forwarded-for` is the original client; intermediates
 * append themselves to the right.
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "";
}

const DEFAULT_SALT = "stock-seasonality-default-salt-rotate-in-prod";

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? DEFAULT_SALT;
  return createHmac("sha256", salt).update(ip).digest("hex");
}

/**
 * Pure policy decision: given the count of recent signups from this IP,
 * is one more allowed? Default max = 3 in any 60-minute window.
 */
export function decideAllow(recentCount: number, max = 3): boolean {
  return recentCount < max;
}

/**
 * Composite: DB lookup + policy. Returns the decision plus the count for
 * logging.
 */
export async function checkRateLimit(
  ipHash: string,
  opts: { windowMinutes?: number; max?: number } = {},
): Promise<{ allowed: boolean; recentCount: number }> {
  const windowMinutes = opts.windowMinutes ?? 60;
  const max = opts.max ?? 3;
  const recentCount = await countRecentSignupsByIp(ipHash, windowMinutes);
  return { allowed: decideAllow(recentCount, max), recentCount };
}
