// One background worker runs Pyodide (CPython compiled to WebAssembly) with two
// modules loaded: server/app/analyzer.py (Big-O) and lab/pytrace.py (tracer).
// Running off the main thread means an infinite loop can't freeze the page:
// a call that runs too long terminates the worker, and the next call boots a new one.
import analyzerSource from '../../../server/app/analyzer.py?raw'
import tracerSource from './pytrace.py?raw'

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'

// Plain-JS module worker, loaded from a Blob so no bundler worker setup is needed.
// (Current Pyodide releases only run in MODULE workers, not classic ones.)
const WORKER = `
import { loadPyodide } from '${PYODIDE}pyodide.mjs'
let py = null
self.onmessage = async (e) => {
  const { id, sources, fn, arg } = e.data
  try {
    if (!py) {
      py = await loadPyodide({ indexURL: '${PYODIDE}' })
      for (const [name, src] of sources) {
        py.FS.writeFile(name + '.py', src)
      }
      py.runPython('import sys; sys.path.insert(0, "."); import analyzer, pytrace, json')
      py.runPython('def analyze_json(code):\\n    return json.dumps(analyzer.analyze(code))')
    }
    if (fn === 'boot') return self.postMessage({ id, ok: true, out: 'ready' })
    const f = py.globals.get(fn) ?? py.pyimport('pytrace')[fn]
    self.postMessage({ id, ok: true, out: f(arg) })
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message || err) })
  }
}
`

let worker: Worker | null = null
let booted: Promise<void> | null = null
let seq = 0
const waiting = new Map<number, { resolve: (v: string) => void; reject: (e: Error) => void }>()

function spawn() {
  const url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }))
  const w = new Worker(url, { type: 'module' })
  w.onmessage = (e) => {
    const { id, ok, out, error } = e.data
    const p = waiting.get(id)
    waiting.delete(id)
    if (ok) p?.resolve(out)
    else p?.reject(new Error(error))
  }
  w.onerror = (e) => {
    waiting.forEach((p) => p.reject(new Error(e.message || 'Python worker crashed.')))
    waiting.clear()
  }
  return w
}

function send(fn: string, arg: string): Promise<string> {
  worker ??= spawn()
  const id = ++seq
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    worker!.postMessage({ id, fn, arg, sources: [['analyzer', analyzerSource], ['pytrace', tracerSource]] })
  })
}

function reset() {
  worker?.terminate()
  worker = null
  booted = null
  waiting.forEach((p) => p.reject(new Error('Stopped: the code ran longer than the time limit (infinite loop?).')))
  waiting.clear()
}

/** Download + start Python once (a few seconds the first time; cached afterwards). */
export function bootPython(): Promise<void> {
  booted ??= send('boot', '').then(() => undefined).catch((e) => { booted = null; throw e })
  return booted
}

/** Run a Python helper by name, with a time limit that excludes the one-time boot. */
export async function callPython(fn: 'analyze_json' | 'trace_json' | 'entry_json', arg: string, timeoutMs = 8000): Promise<string> {
  await bootPython()
  let timer: ReturnType<typeof setTimeout> | undefined
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reset(); reject(new Error('Stopped: the code ran longer than 8 seconds (infinite loop?).')) }, timeoutMs)
  })
  try {
    return await Promise.race([send(fn, arg), limit])
  } finally {
    clearTimeout(timer)
  }
}
