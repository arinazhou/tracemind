import { useSyncExternalStore } from 'react'
import type { CloudUser } from '../cloud/cloud'
import { CLOUD_ENABLED } from '../cloud/config'

export type Status = 'todo' | 'learning' | 'solved' | 'review'

export interface Entry {
  status: Status
  notes: string
  solution: string
  /** YYYY-MM-DD the problem was finished ('' if not done). */
  solvedAt: string
  updatedAt: number
  solvedCount: number
}

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type State = Record<number, Entry>

/**
 * Where records live, in priority order:
 *   1. signed in (Firebase): the account; connecting/synced/saving/offline describe it
 *   2. the local FastAPI server (./dev.sh): same states
 *   3. local: the hosted site signed out, where the browser is the only store
 */
export type SyncState = 'connecting' | 'synced' | 'saving' | 'offline' | 'local'

/** Built for GitHub Pages: no backend, nothing leaves the browser. */
export const HOSTED = import.meta.env.VITE_STATIC === '1'

// With a server, it is the source of truth and localStorage is an offline cache;
// edits made while offline are merged back on reconnect (newer updatedAt wins).
const KEY = 'tracemind:progress:v1'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let state: State = read(KEY, {})
let sync: SyncState = CLOUD_ENABLED ? 'connecting' : HOSTED ? 'local' : 'connecting'
let user: CloudUser | null = null
/** Problems copied from this browser into the account at the last sign-in (for a one-time notice). */
let movedIn = 0
const dirty = new Set<number>() // records not yet saved to the account
let unwatch: (() => void) | null = null
const inflight = new Map<number, ReturnType<typeof setTimeout>>()
const pendingPatches = new Map<number, Partial<Entry>>()

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

const storeKey = () => (user ? `${KEY}:${user.uid}` : KEY)

function persist() {
  try {
    localStorage.setItem(storeKey(), JSON.stringify(state))
  } catch {
    // storage full or blocked: keep the in-memory copy
  }
}

function setSync(s: SyncState) {
  sync = s
  emit()
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

let watching = false

export async function connect() {
  if (CLOUD_ENABLED && !watching) {
    watching = true
    const cloud = await import('../cloud/cloud')
    cloud.watchUser((u) => { (u ? onSignIn(u) : onSignOut()).catch(() => setSync('offline')) })
    return
  }
  if (user) return flushCloud()
  if (HOSTED) { setSync('local'); return }
  try {
    if (Object.keys(state).length) {
      await api('/progress/import', { method: 'POST', body: JSON.stringify(state) })
    }
    state = await api<State>('/progress')
    persist()
    setSync('synced')
  } catch {
    setSync('offline')
  }
}

async function onSignIn(u: CloudUser) {
  const cloud = await import('../cloud/cloud')
  const started = Date.now()
  user = u
  setSync('connecting')
  const remote = await cloud.loadEntries(u.uid)
  // move this browser's signed-out progress into the account (newer edit wins)
  const local: State = read(KEY, {})
  const merged: State = { ...remote }
  const uploads: number[] = []
  for (const [k, e] of Object.entries(local)) {
    const num = Number(k)
    if (!remote[num] || (e.updatedAt ?? 0) > (remote[num].updatedAt ?? 0)) {
      merged[num] = { ...blankEntry(), ...e }
      uploads.push(num)
    }
  }
  await Promise.all(uploads.map((n) => cloud.saveEntry(u.uid, n, merged[n])))
  movedIn = uploads.length
  // edits made while the account was loading are newer than anything above: keep them
  for (const [k, e] of Object.entries(state)) {
    if ((e.updatedAt ?? 0) >= started) { merged[Number(k)] = e; dirty.add(Number(k)) }
  }
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  state = merged
  persist()
  setSync('synced')
  if (dirty.size) flushCloud()
  // live: edits made on another device appear here (unsaved local edits win)
  unwatch?.()
  unwatch = await cloud.watchEntries(u.uid, (num, e) => {
    if (!user || user.uid !== u.uid || dirty.has(num)) return
    const mine = state[num]
    if (e === null) { if (mine) { const next = { ...state }; delete next[num]; state = next } }
    else if (!mine || (e.updatedAt ?? 0) > (mine.updatedAt ?? 0)) state = { ...state, [num]: { ...blankEntry(), ...e } }
    else return
    persist()
    emit()
  })
}

async function onSignOut() {
  const was = user
  unwatch?.()
  unwatch = null
  user = null
  dirty.clear()
  // shared computers: don't leave the account's records behind in this browser
  if (was) try { localStorage.removeItem(`${KEY}:${was.uid}`) } catch { /* ignore */ }
  state = read(KEY, {})
  emit()
  if (HOSTED) setSync('local')
  else { setSync('connecting'); await connect() }
}

async function flushCloud() {
  if (!user || !dirty.size) { if (user && sync !== 'offline') setSync('synced'); return }
  const cloud = await import('../cloud/cloud')
  const uid = user.uid
  const batch = [...dirty]
  dirty.clear()
  setSync('saving')
  try {
    await Promise.all(batch.filter((n) => state[n]).map((n) => cloud.saveEntry(uid, n, state[n])))
    if (!dirty.size) setSync('synced')
  } catch {
    batch.forEach((n) => dirty.add(n)) // retried on reconnect / next edit
    setSync('offline')
  }
}

let cloudTimer: ReturnType<typeof setTimeout> | undefined

export function reconnectIfOffline() {
  if (sync === 'offline') connect()
}

export const blankEntry = (): Entry => ({ status: 'todo', notes: '', solution: '', solvedAt: '', updatedAt: 0, solvedCount: 0 })

export function update(num: number, patch: Partial<Pick<Entry, 'status' | 'notes' | 'solution' | 'solvedAt'>>) {
  const prev = { ...blankEntry(), ...state[num] }
  // done ⇔ has a date: stamp today when marking done, clear it when un-marking
  if (patch.status === 'solved' && !prev.solvedAt && patch.solvedAt === undefined) patch = { ...patch, solvedAt: today() }
  if (patch.status === 'todo') patch = { ...patch, solvedAt: '' }
  const now = Date.now()
  const solvedNow = patch.status === 'solved' && prev.status !== 'solved'
  state = {
    ...state,
    [num]: { ...prev, ...patch, updatedAt: now, solvedCount: prev.solvedCount + (solvedNow ? 1 : 0) },
  }
  persist()
  emit()
  if (user) {
    // status clicks save right away; typing is batched
    dirty.add(num)
    clearTimeout(cloudTimer)
    const typing = patch.notes !== undefined || patch.solution !== undefined
    cloudTimer = setTimeout(flushCloud, typing ? 800 : 0)
    if (sync !== 'offline') setSync('saving')
    return
  }
  if (HOSTED) return

  // Status clicks save immediately; typing (notes/solution) is debounced.
  clearTimeout(inflight.get(num))
  const typing = patch.notes !== undefined || patch.solution !== undefined
  pendingPatches.set(num, { ...(pendingPatches.get(num) ?? {}), ...patch })
  inflight.set(num, setTimeout(() => flush(num), typing ? 600 : 0))
  if (sync !== 'offline') setSync('saving')
}

async function flush(num: number) {
  const patch = pendingPatches.get(num)
  pendingPatches.delete(num)
  inflight.delete(num)
  if (!patch) return
  try {
    const saved = await api<Entry>(`/progress/${num}`, { method: 'PUT', body: JSON.stringify(patch) })
    // keep local text if the user kept typing while this request was in flight
    if (!pendingPatches.has(num)) {
      state = { ...state, [num]: saved }
      persist()
    }
    if (!inflight.size) setSync('synced')
  } catch {
    setSync('offline')
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function useProgress(): State {
  return useSyncExternalStore(subscribe, () => state)
}

export function useSync(): SyncState {
  return useSyncExternalStore(subscribe, () => sync)
}

export function useUser(): CloudUser | null {
  return useSyncExternalStore(subscribe, () => user)
}

/** How many problems the last sign-in moved from this browser into the account; reading it clears it. */
export function takeMovedIn(): number {
  const n = movedIn
  movedIn = 0
  return n
}

/** "Delete my data": wipe the account's records (and this browser's copy). */
export async function deleteCloudData() {
  if (!user) return
  const cloud = await import('../cloud/cloud')
  await cloud.deleteAllEntries(user.uid)
  dirty.clear()
  state = {}
  persist()
  emit()
}

// ---------------------------------------------------------------- backup

export function exportBackup(): string {
  return JSON.stringify({ app: 'tracemind', version: 1, exportedAt: new Date().toISOString(), progress: state }, null, 2)
}

/** Merge a backup file: per problem, the newer edit wins. */
export function importBackup(text: string): number {
  const data = JSON.parse(text)
  if (data?.app !== 'tracemind' || typeof data.progress !== 'object') throw new Error('Not a Tracemind backup file.')
  let merged = 0
  const next = { ...state }
  for (const [num, e] of Object.entries(data.progress as State)) {
    if (!next[+num] || (e.updatedAt ?? 0) > next[+num].updatedAt) {
      next[+num] = { ...blankEntry(), ...e }
      merged++
      if (user) dirty.add(+num)
    }
  }
  state = next
  persist()
  emit()
  if (user) flushCloud() // upload restored records to the account
  else if (!HOSTED) connect() // push merged entries to the server
  return merged
}

// ---------------------------------------------------------------- analyzer

export interface Analysis {
  ok: boolean
  error?: string
  function?: string
  time?: string
  space?: string
  confidence?: 'high' | 'medium' | 'low'
  findings?: { line: number; cost: string; message: string }[]
}

/** Server when available; otherwise the same analyzer.py running in-browser. */
export async function analyzeCode(code: string): Promise<Analysis> {
  if (!HOSTED && sync !== 'offline') {
    try {
      return await api('/analyze', { method: 'POST', body: JSON.stringify({ code }) })
    } catch {
      // fall back to the browser
    }
  }
  const { callPython } = await import('../lab/pyWorker')
  return JSON.parse(await callPython('analyze_json', code))
}
