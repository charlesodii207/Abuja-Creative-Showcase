import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "de", "es", "zh"],
  defaultLocale: "en",
  // English keeps today's addresses (/about). The others get /fr/about etc.
  localePrefix: "as-needed",
});