import { create } from "zustand";

export interface CookieConsentState {
  hasConsented: boolean;
  necessary: boolean;
  analytics: boolean;
  consentTimestamp: number | null;

  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  hydrate: (state: Partial<CookieConsentState>) => void;
  resetConsent: () => void;
}

export const useCookieConsentStore = create<CookieConsentState>((set) => ({
  hasConsented: false,
  necessary: true,
  analytics: false,
  consentTimestamp: null,

  acceptAll: () =>
    set({
      hasConsented: true,
      analytics: true,
      consentTimestamp: Date.now(),
    }),

  acceptNecessaryOnly: () =>
    set({
      hasConsented: true,
      analytics: false,
      consentTimestamp: Date.now(),
    }),

  hydrate: (state) => set(state),

  resetConsent: () =>
    set({
      hasConsented: false,
      analytics: false,
      consentTimestamp: null,
    }),
}));
