import { socials } from "@/lib/content";
import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
} from "./SocialIcons";
import Reveal from "./Reveal";

const iconMap = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
};

export default function FollowSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#11152F]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-10 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-8 h-48 w-48 rounded-full border border-[#00A5A8]/10"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:px-8 md:py-24">
        <Reveal>
          <div className="tricolor-rule mx-auto mb-7">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
            Stay Connected
          </p>
        </Reveal>

        <Reveal delay={140}>
          <h2 className="mt-4 font-display text-3xl leading-tight text-[#F5EFE6] sm:text-4xl md:text-5xl">
            Follow the journey.
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#B8B3AA]/70 sm:text-lg">
            Stay close to the people, ideas, announcements, and experiences
            shaping ACS.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-start justify-center gap-x-12 gap-y-10 sm:gap-x-16">
          {socials.map((social, index) => {
            const Icon = iconMap[social.icon as keyof typeof iconMap];

            if (!Icon) return null;

            return (
              <Reveal
                key={social.name}
                delay={240 + index * 80}
                distance={18}
              >
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow ACS on ${social.name}`}
                  className="group flex min-w-[70px] flex-col items-center gap-3 text-[#B8B3AA]/60 transition-all duration-300 hover:text-[#F5EFE6]"
                >
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#00A5A8]/50 group-hover:shadow-[0_0_20px_rgba(0,165,168,0.12)]">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-[#00A5A8]/0 blur-xl transition-all duration-300 group-hover:bg-[#00A5A8]/15"
                    />

                    <Icon className="relative h-6 w-6 transition-all duration-300 group-hover:scale-110 group-hover:text-[#00A5A8]" />
                  </span>

                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#B8B3AA]/60 transition-colors duration-300 group-hover:text-[#00A5A8]">
                    {social.name}
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={700}>
          <div className="mx-auto mt-14 flex max-w-md items-center justify-center gap-4">
            <span className="h-px flex-1 bg-white/10" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#E59200]" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/30">
              Abuja · Africa
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-[#B80319]" />

            <span className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}