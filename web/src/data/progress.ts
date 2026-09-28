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
export type SyncState = 'connecting' | 'synced' | 'saving' | 'offline'

// The server is the source of truth; localStorage is an offline cache.
// Edits made while offline are merged back on reconnect (newer updatedAt wins).
const KEY = 'tracemind:progress:v1'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let state: State = load()
let sync: SyncState = 'connecting'
const inflight = new Map<number, ReturnType<typeof setTimeout>>()

function load(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: the server copy still has it
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
  const solvedNow = patch.status === 'solved' && prev.status !== 'solved'
  state = {
    ...state,
    [num]: { ...prev, ...patch, updatedAt: Date.now(), solvedCount: prev.solvedCount + (solvedNow ? 1 : 0) },
  }
  persist()
  emit()

  // Status clicks save immediately; typing (notes/solution) is debounced.
  clearTimeout(inflight.get(num))
  const typing = patch.notes !== undefined || patch.solution !== undefined
  const pending = { ...(pendingPatches.get(num) ?? {}), ...patch }
  pendingPatches.set(num, pending)
  inflight.set(num, setTimeout(() => flush(num), typing ? 600 : 0))
  if (sync !== 'offline') setSync('saving')
}

const pendingPatches = new Map<number, Partial<Entry>>()

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

export interface DayActivity { day: string; count: number; solved: number }

export function fetchActivity(): Promise<DayActivity[]> {
  return api(`/activity?tz_offset=${new Date().getTimezoneOffset()}`)
}

export interface Analysis {
  ok: boolean
  error?: string
  function?: string
  time?: string
  space?: string
  confidence?: 'high' | 'medium' | 'low'
  findings?: { line: number; cost: string; message: string }[]
}

export function analyzeCode(code: string): Promise<Analysis> {
  return api('/analyze', { method: 'POST', body: JSON.stringify({ code }) })
}
