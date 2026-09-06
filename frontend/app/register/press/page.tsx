import Link from "next/link";

export default function PressRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Press
      </h1>
      <p className="mt-3 text-muted">
        Cover the Showcase — interviews, behind-the-scenes access, and press briefings.
      </p>

      <p className="mx-auto mt-6 max-w-xl text-left text-sm leading-relaxed text-muted">
        ACS runs a dedicated Media & Press Centre for interviews, press conferences, content
        creation, and accreditation throughout the two days. Press accreditation gives you access to
        cover screenings, performances, panels, the Creative Market, and the Pitching & Deal Room,
        along with opportunities to interview speakers, exhibitors, and organizers. To be
        considered, you&apos;ll need to provide your outlet name and some proof of your editorial
        role — a byline, a link to your publication, or a portfolio of past coverage works well.
        Accreditation is reviewed individually rather than granted automatically, since space in the
        Press Centre is limited. Independent journalists and content creators are welcome to apply
        alongside outlet staff, as long as you can show a genuine editorial track record.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:mx-auto sm:max-w-sm">
        <Link
          href="/register/press/new"
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