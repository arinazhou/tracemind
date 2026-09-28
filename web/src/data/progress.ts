import { useSyncExternalStore } from 'react'

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
 * connecting/synced/saving/offline: running with the FastAPI server (./dev.sh).
 * local: the hosted GitHub Pages build, where the browser is the only store.
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
let sync: SyncState = HOSTED ? 'local' : 'connecting'
const inflight = new Map<number, ReturnType<typeof setTimeout>>()
const pendingPatches = new Map<number, Partial<Entry>>()

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
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

export async function connect() {
  if (HOSTED) return
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
    }
  }
  state = next
  persist()
  emit()
  if (!HOSTED) connect() // push merged entries to the server
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
