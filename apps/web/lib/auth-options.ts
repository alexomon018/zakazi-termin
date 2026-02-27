import { authOptions as sharedAuthOptions } from "@salonko/auth/server";
import type { AuthOptions } from "next-auth";

export const authOptions = sharedAuthOptions as AuthOptions;
