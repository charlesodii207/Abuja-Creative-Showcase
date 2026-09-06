import { event } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg text-cream">{event.name}</p>
            <p className="mt-1 text-sm text-muted">
              Organized by {event.organizer}
            </p>
          </div>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} {event.organizer}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
