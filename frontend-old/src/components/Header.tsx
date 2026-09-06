import { Link } from "react-router-dom";
import { event } from "@/lib/content";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-600 tracking-tight text-cream">
            {event.shortName}
          </span>
          <span className="hidden text-sm text-muted sm:inline">
            {event.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#about" className="hover:text-cream transition-colors">About</a>
          <a href="#programme" className="hover:text-cream transition-colors">Programme</a>
          <a href="#sponsors" className="hover:text-cream transition-colors">Sponsors</a>
          <a href="#faq" className="hover:text-cream transition-colors">FAQ</a>
        </nav>

        <Link
          to="/register"
          className="rounded-full bg-red px-5 py-2.5 text-sm font-medium text-cream transition-transform hover:scale-105"
        >
          Register
        </Link>
      </div>
    </header>
  );
}
