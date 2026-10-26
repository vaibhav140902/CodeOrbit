"use client";

import { useAppPreferences } from "@/lib/preferences-context";

export function PrivacyBanner() {
  const { acceptPrivacyConsent, privacyConsentAccepted, t } = useAppPreferences();

  if (privacyConsentAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:max-w-md">
      <div className="surface-card border border-[color:var(--border-strong)] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("consent_title")}</p>
        <p className="text-soft mt-2 text-sm leading-6">{t("consent_body")}</p>
        <div className="mt-4 flex justify-end">
          <button onClick={acceptPrivacyConsent} className="btn-primary text-sm">
            {t("consent_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
