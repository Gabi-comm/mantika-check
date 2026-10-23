"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { btn } from "@/components/ui";
import { cx } from "@/frontend/format";

const links = [
  { href: "/", label: "Overview" },
  { href: "/features", label: "Features" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/92 backdrop-blur">
      <a href="#content" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-forest px-3 py-2 text-white">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="MANTIKA CHECK home" className="flex min-h-11 items-center">
          <Logo height={32} />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => {
              const on = l.href === "/" ? path === "/" : path?.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={on ? "page" : undefined}
                    className={cx("relative inline-flex min-h-11 items-center px-3 text-[0.92rem] font-medium", on ? "text-heading after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:bg-green" : "text-ink/75 hover:text-ink")}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:block">
            <Link href="/#signin" className={btn("primary", "md")}>
              <LogIn className="size-4" aria-hidden="true" /> Sign in
            </Link>
          </span>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-[var(--radius-s)] border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="fade-up border-t border-line bg-surface px-4 pt-2 pb-4 lg:hidden">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-line/70 text-[1rem] font-medium text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/#signin" onClick={() => setOpen(false)} className={btn("primary", "lg", "mt-4 w-full")}>
            <LogIn className="size-4" aria-hidden="true" /> Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
