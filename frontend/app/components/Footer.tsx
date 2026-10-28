import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { event, socials } from "@/lib/content";
import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
} from "./SocialIcons";

const iconMap = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
};

export default function Footer() {
  const t = useTranslations("Home.footer");
  return (
    <footer className="relative overflow-hidden bg-[#0D1128]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-10 h-52 w-52 rounded-full border border-[#00A5A8]/10"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-14 sm:px-8 md:py-16">
        <div className="tricolor-rule mb-10">
          <span />
          <span />
          <span />
        </div>

        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:gap-16">
          <div>
            <p className="font-display text-2xl leading-tight text-[#F5EFE6]">
              {event.name}
            </p>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#B8B3AA]/65">
              {t("tagline")}
            </p>

            <p className="mt-5 text-sm text-[#B8B3AA]/50">
              {t("organizedBy")}{" "}
              <a
                href="https://www.afrigos-academy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F5EFE6]/70 underline underline-offset-4 transition-colors hover:text-[#00A5A8]"
              >
                {event.organizer}
              </a>
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
              {t("explore")}
            </p>

            <nav className="mt-5 flex flex-col gap-3">
              <Link
                href="/countdown"
                className="w-fit text-sm text-[#B8B3AA]/65 transition-colors hover:text-[#F5EFE6]"
              >
                {t("countdown")}
              </Link>

              <Link
                href="/creative-finance"
                className="w-fit text-sm text-[#B8B3AA]/65 transition-colors hover:text-[#F5EFE6]"
              >
                {t("invest")}
              </Link>

              <Link
                href="/film"
                className="w-fit text-sm text-[#B8B3AA]/65 transition-colors hover:text-[#F5EFE6]"
              >
                {t("film")}
              </Link>

              <Link
                href="/about"
                className="w-fit text-sm text-[#B8B3AA]/65 transition-colors hover:text-[#F5EFE6]"
              >
                {t("about")}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-5">
              {socials.map((social) => {
                const Icon = iconMap[social.icon];

                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("followOn", { name: social.name })}
                    className="text-[#B8B3AA]/50 transition-all duration-300 hover:-translate-y-0.5 hover:text-[#00A5A8]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 sm:items-end">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30">
                {t("location")}
              </p>

              <p className="text-xs text-[#B8B3AA]/40">
                {t("rights", { year: new Date().getFullYear(), organizer: event.organizer })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E59200]" />
          <span className="h-px w-10 bg-white/10" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#B80319]" />
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </footer>
  );
}
