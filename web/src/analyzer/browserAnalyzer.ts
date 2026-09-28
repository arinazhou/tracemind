// Runs the backend's analyzer.py unchanged inside the browser via Pyodide
// (CPython compiled to WebAssembly), so the hosted site needs no server.
// The ~7 MB runtime is fetched from jsDelivr on first use, then cached.
import analyzerSource from '../../../server/app/analyzer.py?raw'
import type { Analysis } from '../data/progress'

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'

interface Pyodide {
  runPython: (code: string) => unknown
  globals: { get: (name: string) => (arg: string) => string }
}

declare global {
  interface Window { loadPyodide?: (opts: { indexURL: string }) => Promise<Pyodide> }
}

let ready: Promise<(code: string) => string> | null = null

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Couldn't load ${src}`))
    document.head.appendChild(el)
  })
}

function boot() {
  ready ??= (async () => {
    if (!window.loadPyodide) await loadScript(`${PYODIDE}pyodide.js`)
    const py = await window.loadPyodide!({ indexURL: PYODIDE })
    py.runPython(analyzerSource)
    py.runPython('import json\ndef analyze_json(code):\n    return json.dumps(analyze(code))')
    return py.globals.get('analyze_json')
  })().catch((e) => {
    ready = null // allow a retry, e.g. after reconnecting
    throw e
  })
  return ready
}

export async function analyzeInBrowser(code: string): Promise<Analysis> {
  const analyzeJson = await boot()
  return JSON.parse(analyzeJson(code))
}
