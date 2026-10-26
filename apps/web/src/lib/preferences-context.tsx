"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePlatformAuth } from "./auth-context";
import { platformApi } from "./platform-api";

type Locale = "en" | "hi";

type Dictionary = Record<string, { en: string; hi: string }>;

const dictionary: Dictionary = {
  home: { en: "Home", hi: "होम" },
  problems: { en: "Problems", hi: "प्रॉब्लम्स" },
  prep: { en: "Prep", hi: "तैयारी" },
  leaderboard: { en: "Leaderboard", hi: "लीडरबोर्ड" },
  activity: { en: "Activity", hi: "एक्टिविटी" },
  pricing: { en: "Pricing", hi: "प्राइसिंग" },
  about: { en: "About", hi: "अबाउट" },
  admin: { en: "Admin", hi: "एडमिन" },
  ranking: { en: "Ranking", hi: "रैंक" },
  theme_dark: { en: "Dark mode", hi: "डार्क मोड" },
  theme_light: { en: "Light mode", hi: "लाइट मोड" },
  login: { en: "Login", hi: "लॉगिन" },
  signup: { en: "Sign up", hi: "साइन अप" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  install: { en: "Install app", hi: "ऐप इंस्टॉल करें" },
  consent_title: { en: "Privacy & consent", hi: "प्राइवेसी और सहमति" },
  consent_body: {
    en: "We use essential auth/storage data plus analytics and AI processing only after consent. This supports GDPR and India IT Act aligned disclosure.",
    hi: "हम आवश्यक auth/storage डेटा के साथ analytics और AI processing का उपयोग सहमति के बाद करते हैं। यह GDPR और India IT Act aligned disclosure के लिए है।",
  },
  consent_accept: { en: "Accept", hi: "स्वीकार करें" },
};

interface AppPreferencesContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  privacyConsentAccepted: boolean;
  acceptPrivacyConsent: () => void;
  t: (key: keyof typeof dictionary) => string;
}

const STORAGE_KEYS = {
  locale: "codeorbit.locale",
  consent: "codeorbit.privacy-consent",
} as const;

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = usePlatformAuth();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [privacyConsentAccepted, setPrivacyConsentAccepted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLocale = window.localStorage.getItem(STORAGE_KEYS.locale);
    const storedConsent = window.localStorage.getItem(STORAGE_KEYS.consent);

    if (storedLocale === "en" || storedLocale === "hi") {
      setLocaleState(storedLocale);
    }

    if (storedConsent === "true") {
      setPrivacyConsentAccepted(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.locale) {
      setLocaleState(profile.locale);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.locale, profile.locale);
      }
    }
  }, [profile?.locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.locale, nextLocale);
    }

    if (user) {
      void platformApi.updateViewerPreferences({ locale: nextLocale }).catch((error) => {
        console.error("Failed to persist locale preference:", error);
      });
    }
  }, [user]);

  const acceptPrivacyConsent = useCallback(() => {
    setPrivacyConsentAccepted(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.consent, "true");
    }

    if (user) {
      void platformApi
        .updateViewerPreferences({ privacyConsentAccepted: true, locale })
        .catch((error) => console.error("Failed to record privacy consent:", error));
    }
  }, [locale, user]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      privacyConsentAccepted,
      acceptPrivacyConsent,
      t: (key) => dictionary[key][locale],
    }),
    [acceptPrivacyConsent, locale, privacyConsentAccepted, setLocale]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider.");
  }
  return context;
};
