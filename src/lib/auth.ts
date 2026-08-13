import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { responsibleLevel: true },
        });

        if (!user || !user.active) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          responsibleLevelId: user.responsibleLevelId ?? null,
          responsibleLevelSlug: user.responsibleLevel?.slug ?? null,
          responsibleLevelName: user.responsibleLevel?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.responsibleLevelId = (user as any).responsibleLevelId;
        token.responsibleLevelSlug = (user as any).responsibleLevelSlug;
        token.responsibleLevelName = (user as any).responsibleLevelName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "LEVEL_RESPONSIBLE";
        session.user.responsibleLevelId = token.responsibleLevelId as string | null;
        session.user.responsibleLevelSlug = token.responsibleLevelSlug as string | null;
        session.user.responsibleLevelName = token.responsibleLevelName as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
