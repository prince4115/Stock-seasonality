/**
 * Waitlist signups. Phase 4 /api/waitlist target.
 */
import { prisma } from "@/lib/prisma";

export async function addToWaitlist(input: {
  email: string;
  source: string | null;
  ipHash: string;
}) {
  return prisma.waitlistSignup.create({
    data: {
      email: input.email.toLowerCase(),
      source: input.source,
      ipHash: input.ipHash,
    },
  });
}

/** True iff the email already exists in the waitlist. */
export async function emailExistsInWaitlist(email: string): Promise<boolean> {
  const row = await prisma.waitlistSignup.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return row !== null;
}

/** Count of signups from the given ipHash in the last `sinceMinutes`. */
export async function countRecentSignupsByIp(
  ipHash: string,
  sinceMinutes: number,
): Promise<number> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  return prisma.waitlistSignup.count({
    where: { ipHash, createdAt: { gte: since } },
  });
}
