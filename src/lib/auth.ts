import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.contactName,
          role: user.role,
          companyName: user.companyName,
          discountPercent: user.discountPercent
            ? Number(user.discountPercent)
            : null,
          language: user.language,
          currency: user.currency,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyName = (user as any).companyName;
        token.discountPercent = (user as any).discountPercent;
        token.language = (user as any).language;
        token.currency = (user as any).currency;
      }
      // When session is updated (e.g. language change), refresh from DB
      if (trigger === "update" && token.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { language: true, currency: true },
          });
          if (freshUser) {
            token.language = freshUser.language;
            token.currency = freshUser.currency;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyName = token.companyName;
        (session.user as any).discountPercent = token.discountPercent;
        (session.user as any).language = token.language;
        (session.user as any).currency = token.currency;
      }
      return session;
    },
  },
};
