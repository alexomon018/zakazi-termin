import type { Account, PrismaClient, User } from "@salonko/prisma";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.avatarUrl,
  };
}

function toAdapterAccount(account: Account): AdapterAccount {
  return {
    userId: account.userId,
    type: account.type as AdapterAccount["type"],
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token ?? undefined,
    access_token: account.access_token ?? undefined,
    expires_at: account.expires_at ?? undefined,
    token_type: account.token_type ?? undefined,
    scope: account.scope ?? undefined,
    id_token: account.id_token ?? undefined,
    session_state: account.session_state ?? undefined,
  };
}

export function SalonkoAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data: AdapterUser) {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          avatarUrl: data.image,
          identityProvider: "GOOGLE",
        },
      });
      return toAdapterUser(user);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      return account?.user ? toAdapterUser(account.user) : null;
    },

    async updateUser(data) {
      // Get existing user to preserve fields that shouldn't be overwritten
      const existingUser = await prisma.user.findUnique({
        where: { id: data.id },
      });

      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          // Only update name if user doesn't already have one
          name: existingUser?.name || data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          // Only update avatar if user doesn't already have one
          avatarUrl: existingUser?.avatarUrl || data.image,
        },
      });
      return toAdapterUser(user);
    },

    async deleteUser(userId) {
      const user = await prisma.user.delete({
        where: { id: userId },
      });
      return toAdapterUser(user);
    },

    async linkAccount(account: AdapterAccount) {
      const createdAccount = await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
      return toAdapterAccount(createdAccount);
    },

    async unlinkAccount({
      providerAccountId,
      provider,
    }: { providerAccountId: string; provider: string }) {
      const deletedAccount = await prisma.account.delete({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });
      return toAdapterAccount(deletedAccount);
    },

    async createSession(data) {
      const session = await prisma.session.create({
        data: {
          userId: data.userId,
          sessionToken: data.sessionToken,
          expires: data.expires,
        },
      });
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) return null;
      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: toAdapterUser(session.user),
      };
    },

    async updateSession(data) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: {
          expires: data.expires,
        },
      });
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async deleteSession(sessionToken) {
      const session = await prisma.session.delete({
        where: { sessionToken },
      });
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async createVerificationToken(data) {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        };
      } catch (error) {
        // Token already used or doesn't exist
        return null;
      }
    },
  };
}
