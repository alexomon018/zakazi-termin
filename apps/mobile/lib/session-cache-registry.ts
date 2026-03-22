import type { QueryClient } from "@tanstack/react-query";

/**
 * Neutral registry that breaks the circular dependency between
 * auth-context.tsx (clearSession) and trpc.tsx (clearQueryCache).
 *
 * Both modules register their cleanup functions here at runtime,
 * and callers use the exported helpers to invoke them.
 */

let clearSessionRef: (() => Promise<void>) | null = null;
let queryClientRef: QueryClient | null = null;

export function registerClearSession(fn: (() => Promise<void>) | null): void {
  clearSessionRef = fn;
}

export function registerQueryClient(client: QueryClient | null): void {
  queryClientRef = client;
}

/** Imperatively clear all react-query caches. Safe to call outside React components. */
export function clearQueryCache(): void {
  queryClientRef?.clear();
}

/** Imperatively clear local auth state (token + user). Safe to call outside React components. */
export async function clearSession(): Promise<void> {
  try {
    clearQueryCache();
    await clearSessionRef?.();
  } catch (err) {
    console.error("[clearSession] Failed to clear credentials:", err);
  }
}
