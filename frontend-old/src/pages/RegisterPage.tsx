import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="max-w-md text-center">
          <div className="tricolor-rule mx-auto mb-6">
            <span /><span /><span />
          </div>
          <h1 className="font-display text-3xl text-cream">
            Registration opens soon
          </h1>
          <p className="mt-4 text-muted">
            This page will hold the category picker and registration forms
            (Phase 2 &amp; 3 of the build). For now, head back and check the
            programme.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full border border-white/20 px-6 py-3 text-sm text-cream hover:border-white/40"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
