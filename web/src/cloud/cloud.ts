// Accounts + cloud records via Firebase (Auth + Firestore). The SDK is loaded lazily,
// only when the cloud is configured, so visitors who never sign in don't download it.
import type { Entry } from '../data/progress'
import { CLOUD_ENABLED, USE_EMULATOR, cloudConfig } from './config'

export interface CloudUser {
  uid: string
  email: string | null
  name: string | null
  photo: string | null
  provider: 'google' | 'password' | 'other'
}

type Sdk = Awaited<ReturnType<typeof boot>>
let sdk: Promise<Sdk> | null = null

async function boot() {
  const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
  const app = initializeApp(cloudConfig!)
  const a = auth.getAuth(app)
  const db = fs.getFirestore(app)
  if (USE_EMULATOR) {
    auth.connectAuthEmulator(a, 'http://127.0.0.1:9099', { disableWarnings: true })
    fs.connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }
  return { auth, fs, a, db }
}

const load = () => (sdk ??= boot())

const toUser = (u: import('firebase/auth').User): CloudUser => ({
  uid: u.uid,
  email: u.email,
  name: u.displayName,
  photo: u.photoURL,
  provider: u.providerData.some((p) => p.providerId === 'google.com') ? 'google' : u.providerData.some((p) => p.providerId === 'password') ? 'password' : 'other',
})

/** Calls back with the signed-in user (or null) now and on every change. */
export async function watchUser(cb: (u: CloudUser | null) => void) {
  if (!CLOUD_ENABLED) return cb(null)
  const { auth, a } = await load()
  auth.onAuthStateChanged(a, (u) => cb(u ? toUser(u) : null))
}

export async function signInWithGoogle() {
  const { auth, a } = await load()
  await auth.signInWithPopup(a, new auth.GoogleAuthProvider())
}

export async function signInWithEmail(email: string, password: string) {
  const { auth, a } = await load()
  await auth.signInWithEmailAndPassword(a, email, password)
}

export async function createAccount(email: string, password: string) {
  const { auth, a } = await load()
  await auth.createUserWithEmailAndPassword(a, email, password)
}

export async function resetPassword(email: string) {
  const { auth, a } = await load()
  await auth.sendPasswordResetEmail(a, email)
}

export async function signOut() {
  const { auth, a } = await load()
  await auth.signOut(a)
}

const progressCol = (s: Sdk, uid: string) => s.fs.collection(s.db, 'users', uid, 'progress')

export async function loadEntries(uid: string): Promise<Record<number, Entry>> {
  const s = await load()
  const snap = await s.fs.getDocs(progressCol(s, uid))
  const out: Record<number, Entry> = {}
  snap.forEach((d) => { out[Number(d.id)] = d.data() as Entry })
  return out
}

/** Live updates from other devices: called with each record that changed on the server. */
export async function watchEntries(uid: string, cb: (num: number, e: Entry | null) => void): Promise<() => void> {
  const s = await load()
  return s.fs.onSnapshot(progressCol(s, uid), (snap) => {
    for (const ch of snap.docChanges()) {
      if (ch.doc.metadata.hasPendingWrites) continue // our own write echoing back
      cb(Number(ch.doc.id), ch.type === 'removed' ? null : (ch.doc.data() as Entry))
    }
  })
}

export async function saveEntry(uid: string, num: number, e: Entry) {
  const s = await load()
  const record = {
    status: e.status, notes: e.notes ?? '', solution: e.solution ?? '', solvedAt: e.solvedAt ?? '',
    updatedAt: Math.floor(e.updatedAt ?? Date.now()), solvedCount: Math.max(0, Math.floor(e.solvedCount ?? 0)),
  }
  await s.fs.setDoc(s.fs.doc(progressCol(s, uid), String(num)), record)
}

/** "Delete my data": removes every record in the account (the sign-in itself stays). */
export async function deleteAllEntries(uid: string) {
  const s = await load()
  const snap = await s.fs.getDocs(progressCol(s, uid))
  await Promise.all(snap.docs.map((d) => s.fs.deleteDoc(d.ref)))
}

/** Firebase error codes → something a person can act on. */
export function explainAuthError(e: unknown): string | null {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string | null> = {
    'auth/popup-closed-by-user': null,
    'auth/cancelled-popup-request': null,
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email. Create one below.',
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead, or reset the password.',
    'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/popup-blocked': 'The browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
    'auth/unauthorized-domain': 'This website isn\'t on the Firebase project\'s list of authorized domains yet.',
    'auth/network-request-failed': 'Couldn\'t reach the sign-in service. Check your internet connection.',
    'auth/account-exists-with-different-credential': 'This email already signs in with a different method (try Google, or email + password).',
  }
  return code in map ? map[code] : (e instanceof Error ? e.message : String(e))
}
