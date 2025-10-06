// FIX: Removed the reference to "vite/client" which was causing a type resolution error. The custom type definitions below are sufficient.

interface ImportMetaEnv {
  // You can define other environment variables here if needed
  // FIX: Added type definitions for Firebase environment variables to resolve TypeScript errors.
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
