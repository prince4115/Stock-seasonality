"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/categories", label: "Categories" },
  { href: "/calendar", label: "Calendar" },
  { href: "/about", label: "About" },
];

export function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm bg-gradient-to-br from-sky-500 to-orange-500"
          />
          Stock Seasonality
        </Link>

        <ul className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  "rounded-md px-3 py-1.5 transition-colors " +
                  (isActive(link.href)
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50")
                }
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
