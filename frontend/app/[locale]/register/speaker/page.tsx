import Link from "next/link";

export default function SpeakerRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Speaker
      </h1>
      <p className="mt-3 text-muted">
        Share your expertise on an industry panel, masterclass, or conversation.
      </p>

      <p className="mx-auto mt-6 max-w-xl text-left text-sm leading-relaxed text-muted">
        ACS runs a full Knowledge Programme across both days — practical, real-world sessions on
        building a sustainable creative business, understanding intellectual property, financing a
        film, music monetization, working with brands, and getting creative work into international
        markets, among others. As a Speaker, you&apos;d be sharing hands-on expertise with an audience
        of working creatives and industry stakeholders, not delivering an academic lecture. We&apos;re
        looking for industry professionals, subject experts, and people with genuine practical
        experience in their field. You&apos;ll be asked for your proposed topic, a short bio, and a
        headshot. Speaker slots are limited and curated, so a clear, specific topic proposal stands
        out far more than a general one.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:mx-auto sm:max-w-sm">
        <Link
          href="/register/speaker/new"
          className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
        >
          New Registration
        </Link>
        <Link
          href="/register/lookup"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
        >
          Already Registered? Check Status
        </Link>
      </div>
    </main>
  );
}