"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { event } from "@/lib/content";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/#about", key: "about" },
  { href: "/#programme", key: "programme" },
  { href: "/countdown", key: "countdown" },
  { href: "/creative-finance", key: "invest" },
  { href: "/#sponsors", key: "sponsors" },
  { href: "/#contact", key: "contact" },
] as const;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/acs-logo.png"
            alt="ACS"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />

          <span className="hidden whitespace-nowrap text-sm text-muted xl:inline">
            {event.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition-colors hover:text-cream"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/register"
            className="hidden whitespace-nowrap rounded-full bg-red px-5 py-2.5 text-sm font-medium text-cream transition-transform hover:scale-105 sm:inline-block"
          >
            {t("register")}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative z-[60] flex h-11 w-11 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-white/10 text-cream lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="relative z-[55] border-t border-white/10 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4 text-sm text-muted">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block cursor-pointer touch-manipulation py-1 transition-colors hover:text-cream"
                onClick={() => setMenuOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}

            <Link
              href="/register"
              className="mt-2 block rounded-full bg-red px-5 py-3 text-center text-sm font-medium text-cream"
              onClick={() => setMenuOpen(false)}
            >
              {t("register")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}