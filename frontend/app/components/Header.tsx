"use client";

import { useState } from "react";
import Link from "next/link";
import { event } from "@/lib/content";

const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#programme", label: "Programme" },
  { href: "/#sponsors", label: "Sponsors" },
  { href: "/#faq", label: "FAQ" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            <span className="text-red">A</span>
            <span className="text-gold">C</span>
            <span className="text-teal">S</span>
          </span>

          <span className="hidden text-sm text-muted sm:inline">
            {event.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden rounded-full bg-red px-5 py-2.5 text-sm font-medium text-cream transition-transform hover:scale-105 sm:inline-block"
          >
            Register
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-cream md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 6 L18 18 M18 6 L6 18"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/10 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm text-muted">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-cream"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <Link
              href="/register"
              className="mt-2 rounded-full bg-red px-5 py-2.5 text-center text-sm font-medium text-cream sm:hidden"
              onClick={() => setMenuOpen(false)}
            >
              Register
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}