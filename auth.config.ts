import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { passwordLoginSchema } from "@/lib/auth/schemas";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // IMPORTANT: use jwt so proxy/auth() can read session from cookie
  session: { strategy: "jwt" },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" },
    },
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Google,
    Credentials({
      id: "email-password",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        redirectTo: { label: "Redirect To", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = passwordLoginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) return true;

      // For Google sign-ins, ensure the user has a role assigned.
      // The adapter creates the user before this callback runs, so we check
      // whether the DB record still has no role (PrismaAdapter may not set it).
      if (account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { role: true, isActive: true },
        });

        if (dbUser && !dbUser.isActive) return false;

        if (dbUser && !dbUser.role) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "CLIENT" },
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string;
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
        session.user.image =
          typeof token.picture === "string" ? token.picture : null;
      }

      return session;
    },
  },
};