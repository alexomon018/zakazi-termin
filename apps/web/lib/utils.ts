import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the application URL, handling different environments:
 * - Production: Uses NEXT_PUBLIC_APP_URL (should be set to https://salonko.rs)
 * - Preview: Uses VERCEL_URL (automatically set by Vercel) if NEXT_PUBLIC_APP_URL is not set
 * - Development: Falls back to localhost or window.location.origin
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicitly set for production)
 * 2. VERCEL_URL (automatically set by Vercel for preview deployments)
 * 3. window.location.origin (client-side, always correct)
 * 4. localhost (development fallback)
 */
export function getAppUrl(): string {
  // Priority 1: Use NEXT_PUBLIC_APP_URL if explicitly set (production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    // Ensure URL has a protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }

  // Priority 2: Server-side: Use VERCEL_URL for preview deployments
  if (typeof window === "undefined" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 3: Client-side: Use window.location.origin (always correct)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Priority 4: Development fallback
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
