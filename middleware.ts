import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Exclure complètement /api du middleware i18n
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
