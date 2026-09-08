import { socials } from "@/lib/content";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";
import Reveal from "./Reveal";

const iconMap = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export default function FollowSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Reveal>
          <div className="tricolor-rule mx-auto mb-6">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">
            Follow our socials
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <p className="mt-2 text-muted">
            Stay updated on speaker announcements, exhibitor spots, and
            everything ACS.
          </p>
        </Reveal>

        <div className="mt-8 flex justify-center gap-10">
          {socials.map((social, index) => {
            const Icon = iconMap[social.icon];

            return (
              <Reveal
                key={social.name}
                delay={230 + index * 100}
                distance={18}
              >
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 text-muted transition-colors duration-300 hover:text-teal"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-teal/40">
                    <Icon className="h-6 w-6" />
                  </span>

                  <span className="text-sm">
                    {social.name}
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}