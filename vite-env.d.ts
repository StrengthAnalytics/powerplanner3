// FIX: Replaced the failing vite/client reference with a manual type definition
// for import.meta.env to resolve TypeScript errors across the project.
interface ImportMetaEnv {
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
