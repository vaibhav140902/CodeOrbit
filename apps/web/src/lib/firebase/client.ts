"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
  type Functions,
} from "firebase/functions";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { getClientFirebaseEnv } from "./env";

interface FirebaseClientServices {
  app: FirebaseApp;
  auth: Auth;
  functions: Functions;
  appCheck?: AppCheck;
}

let cachedServices: FirebaseClientServices | null = null;
let appCheckInitialized = false;
let emulatorConnected = false;

const initAppCheck = (app: FirebaseApp) => {
  const env = getClientFirebaseEnv();
  if (!env || !env.enableAppCheck || !env.appCheckSiteKey || appCheckInitialized || typeof window === "undefined") {
    return undefined;
  }

  if (env.appCheckDebugToken) {
    (self as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      env.appCheckDebugToken === "auto" ? true : env.appCheckDebugToken;
  }

  appCheckInitialized = true;
  return initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(env.appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
};

export const getFirebaseClientServices = async (): Promise<FirebaseClientServices | null> => {
  if (cachedServices) {
    return cachedServices;
  }

  const env = getClientFirebaseEnv();
  if (!env) {
    return null;
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: env.apiKey,
          authDomain: env.authDomain,
          projectId: env.projectId,
          storageBucket: env.storageBucket,
          messagingSenderId: env.messagingSenderId,
          appId: env.appId,
        });

  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);

  const functions = getFunctions(app, env.functionsRegion);
  if (env.useFunctionsEmulator && !emulatorConnected) {
    connectFunctionsEmulator(functions, env.functionsEmulatorHost, env.functionsEmulatorPort);
    emulatorConnected = true;
  }

  const appCheck = initAppCheck(app);

  cachedServices = {
    app,
    auth,
    functions,
    appCheck,
  };

  return cachedServices;
};

export const callFunction = async <TRequest, TResponse>(
  name: string,
  payload: TRequest
): Promise<TResponse> => {
  const services = await getFirebaseClientServices();
  if (!services) {
    throw new Error("Firebase client env is not configured.");
  }

  const callable = httpsCallable<TRequest, TResponse>(services.functions, name);
  const result = await callable(payload);
  return result.data;
};
