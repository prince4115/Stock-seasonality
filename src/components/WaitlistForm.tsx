"use client";

/**
 * Waitlist signup form. Posts to /api/waitlist.
 *
 * Three things worth noting:
 *   - The `website` input is a honeypot — visually hidden but present in
 *     the DOM. Real users don't fill it; bots that auto-fill every field
 *     do. The server returns 201 either way, so bots can't distinguish.
 *   - The form clears `source` from the props into the body so the same
 *     component can be placed in multiple spots and we can tell which one
 *     drove the signup.
 *   - Status messages are intentionally minimal — the user just wants to
 *     know it worked / didn't.
 */
import { useState } from "react";

type Props = {
  /** Sent to the API so we can track which placement drove the signup. */
  source?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function WaitlistForm({ source = "landing" }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website }),
      });

      if (res.ok) {
        setStatus({ kind: "success" });
        setEmail("");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) {
        setStatus({ kind: "error", message: "You're already on the list." });
      } else if (res.status === 429) {
        setStatus({
          kind: "error",
          message: "Too many signups from your network. Try again in an hour.",
        });
      } else if (res.status === 400) {
        setStatus({
          kind: "error",
          message: data.error ?? "Please use a valid email.",
        });
      } else {
        setStatus({
          kind: "error",
          message: "Something went wrong. Try again in a moment.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm dark:border-orange-900/60 dark:bg-orange-950/40">
        <p className="font-medium text-orange-800 dark:text-orange-200">You&apos;re on the list.</p>
        <p className="mt-1 text-xs text-orange-700/80 dark:text-orange-300/80">
          We&apos;ll email you when we ship updates. No spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === "submitting"}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />

        {/* Honeypot: visually hidden but tab-reachable. Bots that auto-fill
            all inputs will fill this; real users won't. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={status.kind === "submitting" || email.length === 0}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status.kind === "submitting" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="text-xs text-sky-700 dark:text-sky-400">
          {status.message}
        </p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Get notified when we ship new pages. Email only, no spam.
        </p>
      )}
    </form>
  );
}
