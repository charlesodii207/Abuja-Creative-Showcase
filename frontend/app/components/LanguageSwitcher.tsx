"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  zh: "中文",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();

  function onChange(next: string) {
    // Keep the page and any ?query (e.g. a reference number) when switching.
    const query = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${query}`, { locale: next });
  }

  return (
    <select
      value={locale}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t("language")}
      className="cursor-pointer rounded-full border border-white/10 bg-ink px-3 py-2 text-sm text-cream outline-none transition-colors hover:border-white/30"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}