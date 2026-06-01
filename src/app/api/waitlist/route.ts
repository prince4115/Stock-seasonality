/**
 * POST /api/waitlist
 *
 * Body: { email: string, source?: string }
 *
 * Returns:
 *   201 { ok: true }                 — signup recorded
 *   400 { error: "invalid email" }   — bad email
 *   409 { error: "already signed up" } — email already in waitlist
 *   429 { error: "rate limited" }    — too many signups from this IP recently
 *   500 on unexpected errors
 *
 * Rate limit: 3 signups per IP per 60 minutes (DB-backed). IPs are hashed
 * with HMAC-SHA256 before storage — we never persist raw IPs.
 */
import { type NextRequest, NextResponse } from "next/server";
import { addToWaitlist, emailExistsInWaitlist } from "@/lib/data/waitlist";
import { checkRateLimit, extractClientIp, hashIp, isValidEmail } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  const trimmedEmail = email.trim();

  // Honeypot — the form ships a hidden `website` field that real users
  // never fill in. Bots that auto-fill every input do. We return 201 to
  // hide that we caught them; no DB write happens.
  const honeypot = (body as { website?: unknown })?.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const rawSource = (body as { source?: unknown })?.source;
  const source =
    typeof rawSource === "string" && rawSource.length > 0 && rawSource.length <= 64
      ? rawSource
      : null;

  const ip = extractClientIp(req.headers);
  const ipHash = hashIp(ip);

  const { allowed, recentCount } = await checkRateLimit(ipHash);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate limited", recentCount, retryAfterMinutes: 60 },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  if (await emailExistsInWaitlist(trimmedEmail)) {
    return NextResponse.json({ error: "already signed up" }, { status: 409 });
  }

  try {
    await addToWaitlist({ email: trimmedEmail, source, ipHash });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    // Most likely a race on the unique-email constraint between the check
    // above and the insert here.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "already signed up" }, { status: 409 });
    }
    console.error("[waitlist] insert failed:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
