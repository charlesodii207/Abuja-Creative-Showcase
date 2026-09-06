import { socials } from "@/lib/content";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";

const iconMap = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export default function FollowSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <div className="tricolor-rule mx-auto mb-6">
          <span />
          <span />
          <span />
        </div>

        <h2 className="font-display text-2xl text-cream sm:text-3xl">
          Follow our socials
        </h2>

        <p className="mt-2 text-muted">
          Stay updated on speaker announcements, exhibitor spots, and
          everything ACS.
        </p>

        <div className="mt-8 flex justify-center gap-8">
          {socials.map((social) => {
            const Icon = iconMap[social.icon];

            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-teal"
              >
                <Icon className="h-7 w-7" />
                <span className="text-sm">{social.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}