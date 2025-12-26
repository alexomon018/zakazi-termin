import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SalonkoAdapter } from "./adapter";
import { ErrorCode } from "./error-codes";
import { verifyPassword } from "./password";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
      locale: string;
      timeZone: string;
    };
  }

  interface User {
    id: number;
    email: string;
    name?: string | null;
    username?: string | null;
    locale?: string;
    timeZone?: string;
    identityProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    email: string;
    name?: string | null;
    username?: string | null;
    locale: string;
    timeZone: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: SalonkoAdapter(prisma),
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
      id: "credentials",
      name: "Email i Lozinka",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(ErrorCode.InvalidCredentials);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { password: true },
        });

        if (!user) {
          throw new Error(ErrorCode.IncorrectEmailPassword);
        }

        // Check if user signed up with OAuth
        if (user.identityProvider !== "EMAIL" || !user.password?.hash) {
          throw new Error(ErrorCode.WrongProvider);
        }

        const isValid = await verifyPassword(credentials.password, user.password.hash);

        if (!isValid) {
          throw new Error(ErrorCode.IncorrectEmailPassword);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          locale: user.locale,
          timeZone: user.timeZone,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // On session update
      if (trigger === "update" && session) {
        return {
          ...token,
          name: session.name ?? token.name,
          locale: session.locale ?? token.locale,
        };
      }

      // Initial sign in
      if (user) {
        token.id = user.id as number;
        token.email = user.email!;
        token.name = user.name;
        token.username = user.username;
        token.locale = user.locale ?? "sr";
        token.timeZone = user.timeZone ?? "Europe/Belgrade";
      }

      // OAuth sign in - fetch additional user data
      if (account?.type === "oauth" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.locale = dbUser.locale;
          token.timeZone = dbUser.timeZone;
        }
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          username: token.username,
          locale: token.locale,
          timeZone: token.timeZone,
        },
      };
    },

    async signIn({ user, account, profile }) {
      // Credentials provider - already validated in authorize
      if (account?.type === "credentials") {
        return true;
      }

      // OAuth provider (Google)
      if (account?.type === "oauth") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        // Check for existing user
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Update identity provider if switching from EMAIL to GOOGLE
          if (existingUser.identityProvider === "EMAIL") {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                identityProvider: "GOOGLE",
                identityProviderId: account.providerAccountId,
                emailVerified: new Date(),
                avatarUrl: user.image ?? existingUser.avatarUrl,
              },
            });
          }
          return true;
        }

        // Create new user with Google
        const username = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const generatedUsername = await generateUniqueUsername(username);

        await prisma.user.create({
          data: {
            email,
            name: user.name,
            username: generatedUsername,
            avatarUrl: user.image,
            emailVerified: new Date(),
            identityProvider: "GOOGLE",
            identityProviderId: account.providerAccountId,
          },
        });

        // Send welcome email to new user
        try {
          await emailService.sendWelcomeEmail({
            userName: user.name || "Korisnik",
            userEmail: email,
            username: generatedUsername,
          });
        } catch (error) {
          logger.error("Failed to send welcome email", { error, email });
          // Don't block sign-in if email fails
        }

        return true;
      }

      return false;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows same-domain URLs
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

const MAX_USERNAME_ATTEMPTS = 100;

async function generateUniqueUsername(base: string): Promise<string> {
  const username = base.slice(0, 20);
  let counter = 0;

  while (counter < MAX_USERNAME_ATTEMPTS) {
    const candidate = counter === 0 ? username : `${username}${counter}`;
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!existing) return candidate;
    counter++;
  }

  // Fallback: append random string if too many attempts
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${username.slice(0, 14)}${randomSuffix}`;
}
