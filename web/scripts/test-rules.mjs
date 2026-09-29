// Security-rule tests: run inside the Firestore emulator via
//   npx firebase-tools emulators:exec --only firestore "node web/scripts/test-rules.mjs"
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'demo-tracemind',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
})
const entry = { status: 'solved', notes: 'check before insert', solution: 'class Solution: ...', solvedAt: '2026-09-29', updatedAt: 1, solvedCount: 1 }
const alice = env.authenticatedContext('alice').firestore()
const bob = env.authenticatedContext('bob').firestore()
const anon = env.unauthenticatedContext().firestore()

let passed = 0
const check = async (name, p) => { await p; passed++; console.log('✓', name) }

await check('owner can write a valid record', assertSucceeds(setDoc(doc(alice, 'users/alice/progress/1'), entry)))
await check('owner can read it back', assertSucceeds(getDoc(doc(alice, 'users/alice/progress/1'))))
await check('owner can list their records', assertSucceeds(getDocs(collection(alice, 'users/alice/progress'))))
await check('owner can update', assertSucceeds(setDoc(doc(alice, 'users/alice/progress/1'), { ...entry, notes: 'edited', updatedAt: 2 })))
await check('owner can delete', assertSucceeds(deleteDoc(doc(alice, 'users/alice/progress/1'))))
await check('another user cannot read', assertFails(getDoc(doc(bob, 'users/alice/progress/1'))))
await check('another user cannot list', assertFails(getDocs(collection(bob, 'users/alice/progress'))))
await check('another user cannot write', assertFails(setDoc(doc(bob, 'users/alice/progress/2'), entry)))
await check('signed-out visitors cannot read', assertFails(getDoc(doc(anon, 'users/alice/progress/1'))))
await check('signed-out visitors cannot write', assertFails(setDoc(doc(anon, 'users/alice/progress/1'), entry)))
await check('no extra fields', assertFails(setDoc(doc(alice, 'users/alice/progress/3'), { ...entry, isAdmin: true })))
await check('no unknown status', assertFails(setDoc(doc(alice, 'users/alice/progress/3'), { ...entry, status: 'hacked' })))
await check('no oversized notes', assertFails(setDoc(doc(alice, 'users/alice/progress/3'), { ...entry, notes: 'x'.repeat(100001) })))
await check('no bad dates', assertFails(setDoc(doc(alice, 'users/alice/progress/3'), { ...entry, solvedAt: 'yesterday' })))
await check('record ids must be problem numbers', assertFails(setDoc(doc(alice, 'users/alice/progress/abc'), entry)))
await check('nothing outside users/{uid}/progress', assertFails(setDoc(doc(alice, 'users/alice'), { name: 'x' })))
await check('no global collections', assertFails(setDoc(doc(alice, 'leaderboard/alice'), { score: 1 })))

await env.cleanup()
console.log(`\n${passed} rule checks passed`)
