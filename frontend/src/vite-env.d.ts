/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string;
  readonly VITE_PISTON_RUNTIMES_URL?: string;
  readonly VITE_PISTON_RUNTIMES_URLS?: string;
  readonly VITE_PISTON_EXECUTE_URL?: string;
  readonly VITE_PISTON_EXECUTE_URLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
