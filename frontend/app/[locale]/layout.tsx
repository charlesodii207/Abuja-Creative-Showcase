import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import SiteChrome from "../components/SiteChrome";
import PageTracker from "../components/PageTracker";
import { routing } from "@/i18n/routing";

const OG_LOCALES: Record<string, string> = {
  en: "en_NG",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  zh: "zh_CN",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return {
    metadataBase: new URL("https://africacreativeshowcase.com"),

    title: {
      default: t("title"),
      template: `%s | ${t("siteName")}`,
    },

    description: t("description"),

    keywords: [
      "Afriqa Creative Showcase",
      "Afriqa Creative Showcase 2026",
      "creative events in Abuja",
      "Abuja creative events",
      "creative industry events Abuja",
      "creative industry Abuja",
      "Abuja events 2026",
      "creative opportunities Abuja",
      "creative industry Nigeria",
      "film events Abuja",
      "music events Abuja",
      "fashion events Abuja",
      "creative technology Abuja",
      "Old Parade Ground Abuja",
      "events at Old Parade Ground Abuja",
    ],

    authors: [{ name: "AFRIGOS Film & Media Academy" }],
    creator: "AFRIGOS Film & Media Academy",

    alternates: {
      canonical: prefix || "/",
    },

    verification: {
      google: "BQBpC9A6IKW3hpbB0HgoUBuSywB_q4yscboZT6qp8Do",
    },

    openGraph: {
      type: "website",
      url: `https://africacreativeshowcase.com${prefix}/`,
      siteName: t("siteName"),
      title: t("title"),
      description: t("ogDescription"),
      locale: OG_LOCALES[locale] ?? "en_NG",
      images: [
        {
          url: "/images/acspreview.jpeg",
          width: 1200,
          height: 630,
          alt: "Afriqa Creative Showcase 2026",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: "Afriqa Creative Showcase 2026",
      description: t("twitterDescription"),
      images: ["/images/acspreview.jpeg"],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SiteChrome>{children}</SiteChrome>
        </NextIntlClientProvider>

        {/*
          First-party traffic tracking — records each page view (with IP
          and social source) to our own API, shown at /admin/traffic.
          Wrapped in Suspense because it reads the URL's query string.
          It skips /admin pages on its own.
        */}
        <Suspense fallback={null}>
          <PageTracker />
        </Suspense>

        {/*
          Site analytics (Umami) — page views, visits per day, referrers,
          and location, viewed at cloud.umami.is. Only loads in production
          builds, so local development and testing don't pollute real
          traffic numbers. "afterInteractive" means it loads after the
          page is already usable, so it never blocks or slows the site
          down for visitors.
        */}
        {process.env.NODE_ENV === "production" && (
          <Script
            strategy="afterInteractive"
            src="https://cloud.umami.is/script.js"
            data-website-id="5ed657e8-e0ba-479b-8bac-060d061455f7"
          />
        )}

        {/*
          Meta Pixel — tracks page views and ad-click attribution (via the
          fbclid URL parameter) for Meta/Instagram ad campaigns, viewed in
          Meta Events Manager. Production-only, same reasoning as Umami
          above: local testing shouldn't show up as real ad-campaign
          traffic. "afterInteractive" keeps it from blocking page render.
        */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1202090745804323');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src="https://www.facebook.com/tr?id=1202090745804323&ev=PageView&noscript=1"
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}