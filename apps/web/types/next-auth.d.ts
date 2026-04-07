import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      salonName?: string | null;
      salonSlug?: string | null;
      image?: string | null;
      locale?: string;
      timeZone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    salonSlug?: string | null;
    locale?: string;
    timeZone?: string;
    identityProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    salonSlug?: string | null;
    locale: string;
    timeZone: string;
    subscriptionStatus?: string | null;
  }
}
