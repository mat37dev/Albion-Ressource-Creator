import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight auth config used in middleware (Edge Runtime compatible).
 * No Node.js modules (no DB, no bcrypt) — JWT verification only.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/fr/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
