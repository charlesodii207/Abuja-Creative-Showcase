import Link from "next/link";
import { event, socials } from "@/lib/content";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";

const iconMap = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="tricolor-rule mb-6">
          <span />
          <span />
          <span />
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg text-cream">
              {event.name}
            </p>

            <p className="mt-1 text-sm text-muted">
              Organized by{" "}
              <a
                href="https://www.afrigos-academy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-cream"
              >
                {event.organizer}
              </a>
            </p>

            <Link
              href="/countdown"
              className="mt-2 inline-block text-sm text-teal underline underline-offset-4 transition-colors hover:text-cream"
            >
              See countdown to ACS 2026 →
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex gap-4">
              {socials.map((social) => {
                const Icon = iconMap[social.icon];

                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="text-muted transition-colors hover:text-teal"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} {event.organizer}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}