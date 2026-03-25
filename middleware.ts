import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const intlMiddleware = createMiddleware(routing);

const { auth } = NextAuth(authConfig);

// Routes requiring authentication (any role)
const AUTH_PATHS = ["/profile"];
// Routes requiring admin role
const ADMIN_PATHS = ["/admin"];

export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = (req as NextRequest & { auth?: { user?: { role?: string } } }).auth;

  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en)/, "");
  const localeMatch = pathname.match(/^\/(fr|en)/);
  const locale = localeMatch ? localeMatch[1] : "fr";

  const isAuthRequired = AUTH_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + "/")
  );
  const isAdminRequired = ADMIN_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + "/")
  );

  if (isAuthRequired && !session) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRequired) {
    if (!session) {
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user?.role !== "admin") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)" ],
};
