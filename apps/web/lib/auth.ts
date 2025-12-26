import { authOptions } from "@salonko/auth";
import { getServerSession } from "next-auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}
