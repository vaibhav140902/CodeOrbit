import { z } from "zod";

const firebaseEnvSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
  functionsRegion: z.string().min(1).default("asia-south2"),
  appCheckSiteKey: z.string().optional(),
  enableAppCheck: z.boolean().default(false),
  appCheckDebugToken: z.string().optional(),
  useFunctionsEmulator: z.boolean().default(false),
  functionsEmulatorHost: z.string().default("127.0.0.1"),
  functionsEmulatorPort: z.number().int().positive().default(5001),
});

let warned = false;

export const getClientFirebaseEnv = () => {
  const result = firebaseEnvSchema.safeParse({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    functionsRegion: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? "asia-south2",
    appCheckSiteKey: process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY,
    enableAppCheck: process.env.NEXT_PUBLIC_ENABLE_APPCHECK === "true",
    appCheckDebugToken: process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN,
    useFunctionsEmulator: process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === "true",
    functionsEmulatorHost: process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST ?? "127.0.0.1",
    functionsEmulatorPort: Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT ?? "5001"),
  });

  if (result.success) {
    return result.data;
  }

  if (!warned && typeof window !== "undefined") {
    warned = true;
    console.warn("Firebase env vars are not configured for the Next.js app yet.");
  }

  return null;
};
