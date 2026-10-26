"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type IdTokenResult,
} from "firebase/auth";
import type { UserProfile } from "@codeorbit/schema";
import { getFirebaseClientServices } from "./firebase/client";
import { platformApi } from "./platform-api";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authEnabled: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutCurrentUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type HydratableUser = Pick<User, "uid" | "email" | "displayName" | "getIdTokenResult">;

const fallbackDisplayName = (email: string | null | undefined) =>
  (email ?? "User").split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "User";

const buildFallbackProfile = (currentUser: HydratableUser, tokenResult?: IdTokenResult | null): UserProfile => ({
  uid: currentUser.uid,
  email: currentUser.email ?? "",
  displayName: currentUser.displayName ?? fallbackDisplayName(currentUser.email),
  isAdmin: tokenResult?.claims.admin === true,
  locale: "en",
  role:
    tokenResult?.claims.workspaceRole === "admin" ||
    tokenResult?.claims.workspaceRole === "recruiter_beta" ||
    tokenResult?.claims.workspaceRole === "campus_beta"
      ? tokenResult.claims.workspaceRole
      : tokenResult?.claims.admin === true
        ? "admin"
        : "user",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(true);
  const hydratingRef = useRef(false);

  const hydrateProfile = useCallback(async (currentUser: HydratableUser) => {
    const tokenResult = await currentUser.getIdTokenResult().catch(() => null);
    const fallback = buildFallbackProfile(currentUser, tokenResult);
    setProfile(fallback);

    if (hydratingRef.current) {
      return fallback;
    }

    hydratingRef.current = true;

    try {
      try {
        const viewerProfile = await platformApi.getViewerProfile();
        setProfile(viewerProfile);
        return viewerProfile;
      } catch (viewerError) {
        if (!currentUser.email) {
          console.warn("Viewer profile unavailable, using Firebase fallback profile.", viewerError);
          return fallback;
        }

        try {
          const bootstrappedProfile = await platformApi.bootstrapUserProfile({
            email: currentUser.email,
            displayName: currentUser.displayName ?? fallback.displayName,
          });
          setProfile(bootstrappedProfile);
          return bootstrappedProfile;
        } catch (bootstrapError) {
          console.warn("Profile bootstrap unavailable, using Firebase fallback profile.", bootstrapError);
          return fallback;
        }
      }
    } finally {
      hydratingRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const services = await getFirebaseClientServices();
    if (!services?.auth.currentUser) {
      setProfile(null);
      return;
    }

    const currentUser = services.auth.currentUser;
    await hydrateProfile(currentUser);
  }, [hydrateProfile]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const services = await getFirebaseClientServices();
      if (!services) {
        setAuthEnabled(false);
        setLoading(false);
        return;
      }

      setAuthEnabled(true);
      unsubscribe = onAuthStateChanged(services.auth, async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          await hydrateProfile(currentUser);
        } finally {
          setLoading(false);
        }
      });

      void getRedirectResult(services.auth).catch((error) => {
        console.warn("Google redirect result unavailable:", error);
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, [hydrateProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      authEnabled,
      signInWithEmail: async (email, password) => {
        const services = await getFirebaseClientServices();
        if (!services) {
          throw new Error("Firebase auth is not configured.");
        }
        await signInWithEmailAndPassword(services.auth, email, password);
      },
      signUpWithEmail: async (email, password, displayName) => {
        const services = await getFirebaseClientServices();
        if (!services) {
          throw new Error("Firebase auth is not configured.");
        }

        const credential = await createUserWithEmailAndPassword(services.auth, email, password);
        await updateProfile(credential.user, { displayName });
        await hydrateProfile(credential.user);
      },
      signInWithGoogle: async () => {
        const services = await getFirebaseClientServices();
        if (!services) {
          throw new Error("Firebase auth is not configured.");
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
          const credential = await signInWithPopup(services.auth, provider);
          await hydrateProfile(credential.user);
        } catch (error) {
          const code =
            typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: string }).code)
              : "";

          if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
            await signInWithRedirect(services.auth, provider);
            return;
          }

          throw error;
        }
      },
      signOutCurrentUser: async () => {
        const services = await getFirebaseClientServices();
        if (!services) {
          return;
        }
        await signOut(services.auth);
      },
      refreshProfile,
    }),
    [authEnabled, hydrateProfile, loading, profile, refreshProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const usePlatformAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("usePlatformAuth must be used within AuthProvider.");
  }
  return context;
};
