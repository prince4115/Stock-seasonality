import { describe, expect, it } from "vitest";
import { decideAllow, extractClientIp, hashIp, isValidEmail } from "./rate-limit";

describe("isValidEmail", () => {
  it("accepts plain addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.com")).toBe(true);
    expect(isValidEmail("  with-whitespace@example.com  ")).toBe(true); // trim-tolerant
  });

  it("rejects obviously bad input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@nohost")).toBe(false);
    expect(isValidEmail("nodomain@")).toBe(false);
    expect(isValidEmail("no@tld")).toBe(false);
    expect(isValidEmail("two@@signs.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail({})).toBe(false);
  });

  it("rejects overly long addresses", () => {
    const local = "a".repeat(300);
    expect(isValidEmail(`${local}@b.co`)).toBe(false);
  });
});

describe("extractClientIp", () => {
  it("returns the first hop from x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" });
    expect(extractClientIp(h)).toBe("1.2.3.4");
  });

  it("trims whitespace from the first hop", () => {
    const h = new Headers({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(extractClientIp(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when xff is absent", () => {
    const h = new Headers({ "x-real-ip": "10.0.0.1" });
    expect(extractClientIp(h)).toBe("10.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip when both present", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "10.0.0.1" });
    expect(extractClientIp(h)).toBe("1.2.3.4");
  });

  it("returns empty string when neither header is set", () => {
    expect(extractClientIp(new Headers())).toBe("");
  });
});

describe("hashIp", () => {
  it("produces stable 64-character hex digests", () => {
    const h = hashIp("1.2.3.4");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
  });

  it("differs across inputs", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("1.2.3.5"));
  });

  it("differs from the raw IP (i.e., is actually hashed)", () => {
    expect(hashIp("1.2.3.4")).not.toBe("1.2.3.4");
  });
});

describe("decideAllow", () => {
  it("allows when count is under the limit", () => {
    expect(decideAllow(0, 3)).toBe(true);
    expect(decideAllow(2, 3)).toBe(true);
  });

  it("denies at and above the limit", () => {
    expect(decideAllow(3, 3)).toBe(false);
    expect(decideAllow(99, 3)).toBe(false);
  });

  it("defaults max to 3", () => {
    expect(decideAllow(2)).toBe(true);
    expect(decideAllow(3)).toBe(false);
  });
});
