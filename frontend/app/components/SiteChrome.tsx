// app/components/SiteChrome.tsx
// Wraps every public page with the header and footer. The admin dashboard
// and staff scanner have their own layouts and never reach this file.
import Header from "./Header";
import Footer from "./Footer";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}