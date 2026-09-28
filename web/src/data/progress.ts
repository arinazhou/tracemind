import { useSyncExternalStore } from 'react'

export type Status = 'todo' | 'learning' | 'solved' | 'review'

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'learning', label: 'Learning' },
  { id: 'solved', label: 'Solved' },
  { id: 'review', label: 'Review again' },
]

export interface Entry {
  status: Status
  notes: string
  solution: string
  updatedAt: number
  solvedCount: number
}

type State = Record<number, Entry>
interface Event { num: number; kind: 'status' | 'solution'; value: string; at: number }

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
const EVENTS_KEY = 'tracemind:activity:v1'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let state: State = read(KEY, {})
let events: Event[] = read(EVENTS_KEY, [])
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
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
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

export const blankEntry = (): Entry => ({ status: 'todo', notes: '', solution: '', updatedAt: 0, solvedCount: 0 })

export function update(num: number, patch: Partial<Pick<Entry, 'status' | 'notes' | 'solution'>>) {
  const prev = state[num] ?? blankEntry()
  const now = Date.now()
  const solvedNow = patch.status === 'solved' && prev.status !== 'solved'
  state = {
    ...state,
    [num]: { ...prev, ...patch, updatedAt: now, solvedCount: prev.solvedCount + (solvedNow ? 1 : 0) },
  }
  // local activity log (mirrors the server's), used when there is no server
  if (patch.status && patch.status !== prev.status) events = [...events, { num, kind: 'status', value: patch.status, at: now }]
  if (patch.solution !== undefined && !prev.solution && patch.solution) events = [...events, { num, kind: 'solution', value: '', at: now }]
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

// ---------------------------------------------------------------- activity

export interface DayActivity { day: string; count: number; solved: number }

const localDay = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function fetchActivity(): Promise<DayActivity[]> {
  if (!HOSTED && sync !== 'offline') {
    try {
      return await api(`/activity?tz_offset=${new Date().getTimezoneOffset()}`)
    } catch {
      // fall through to the local log
    }
  }
  const byDay = new Map<string, DayActivity>()
  for (const e of events) {
    const day = localDay(e.at)
    const d = byDay.get(day) ?? { day, count: 0, solved: 0 }
    d.count++
    if (e.kind === 'status' && e.value === 'solved') d.solved++
    byDay.set(day, d)
  }
  return [...byDay.values()]
}

// ---------------------------------------------------------------- backup

export function exportBackup(): string {
  return JSON.stringify({ app: 'tracemind', version: 1, exportedAt: new Date().toISOString(), progress: state, activity: events }, null, 2)
}

/** Merge a backup file: per problem, the newer edit wins; activity is unioned. */
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
  const seen = new Set(events.map((e) => `${e.num}|${e.kind}|${e.at}`))
  const incoming = (Array.isArray(data.activity) ? data.activity : []) as Event[]
  events = [...events, ...incoming.filter((e) => !seen.has(`${e.num}|${e.kind}|${e.at}`))].sort((a, b) => a.at - b.at)
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
  const { analyzeInBrowser } = await import('../analyzer/browserAnalyzer')
  return analyzeInBrowser(code)
}
