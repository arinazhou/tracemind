import type { FirebaseOptions } from 'firebase/app'

/**
 * Firebase web-app config: Firebase console → Project settings → Your apps → SDK setup.
 * These values identify the project; they are not secrets. Who can read or write what is
 * enforced by firestore.rules on Google's servers.
 *
 * While this is null the site runs exactly as before (progress in the browser, no sign-in).
 */
const FIREBASE_CONFIG: FirebaseOptions | null = null

/** `VITE_FIREBASE_EMULATOR=1 npm run dev` talks to the local emulators instead (for testing). */
export const USE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === '1'

export const cloudConfig: FirebaseOptions | null = USE_EMULATOR
  ? { apiKey: 'demo-key', projectId: 'demo-tracemind', authDomain: 'demo-tracemind.firebaseapp.com', appId: 'demo' }
  : FIREBASE_CONFIG

export const CLOUD_ENABLED = cloudConfig !== null
