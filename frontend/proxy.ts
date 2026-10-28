import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Language routing applies to public pages only. Admin, staff scanner,
  // API calls, Next.js internals and files with an extension are skipped.
  matcher: ["/((?!api|admin|staff|_next|_vercel|.*\\..*).*)"],
};