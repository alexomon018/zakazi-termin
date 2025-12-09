"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@zakazi-termin/trpc";

export const trpc = createTRPCReact<AppRouter>();
