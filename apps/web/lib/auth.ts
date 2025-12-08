import { getServerSession } from "next-auth";
import { authOptions } from "@zakazi-termin/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}
