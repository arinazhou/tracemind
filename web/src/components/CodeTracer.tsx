import { useEffect, useRef, useState } from 'react'
import { analyzeCode, type Analysis } from '../data/progress'
import type { Step } from '../engine/types'
import { callPython } from '../lab/pyWorker'
import { explainError, sampleArgs } from '../lab/friendly'
import { showResult, toSteps, type TraceResult } from '../lab/traceToSteps'
import { AnalysisCard } from './AnalysisCard'
import { StepView } from './StepView'

interface Props {
  code: string
  /** Makes the code editable; called on every edit. */
  onCodeChange?: (code: string) => void
  args?: string
  driver?: string
  stdin?: string
  autoRun?: boolean
  /** Remember edits to args/driver/stdin/mode (the Code Visualizer keeps a draft). */
  onRunInputs?: (inputs: { args: string; driver: string; stdin: string; argsFor?: string }) => void
  /**
   * Which parameter list the initial args were written for. When the code's parameters no
   * longer match, the args are replaced with fresh samples. Omit to trust the args for any
   * code (lesson examples, a problem's own test case).
   */
  argsFor?: string
  /** Scroll to the animation after a manual run (off inside lessons). */
  scrollOnRun?: boolean
  showAnalyze?: boolean
}

/** "def twoSum(self, nums, target)" → { call: "Solution().twoSum", params: "nums, target" } */
export function signature(code: string) {
  const cls = code.match(/^class\s+(\w+)/m)
  const body = cls ? code.slice(cls.index) : code
  const fn = [...body.matchAll(/^\s*def\s+(\w+)\s*\(([^)]*)\)/gm)].find((m) => !m[1].startsWith('_'))
  if (!fn) return null
  const params = fn[2].split(',').map((p) => p.split(/[:=]/)[0].trim()).filter((p) => p && p !== 'self')
  return { call: cls ? `${cls[1]}().${fn[1]}` : fn[1], params: params.join(', ') }
}

type Mode = 'script' | 'call' | 'driver'

/** A program with its own top-level statements (loops, prints, calls) runs as a script. */
export function looksLikeScript(code: string) {
  if (/^class\s+Solution\b/m.test(code)) return false
  let inDoc = false
  for (const line of code.split('\n')) {
    const quotes = (line.match(/"""|'''/g) ?? []).length
    if (inDoc || quotes) { if (quotes % 2) inDoc = !inDoc; continue }
    if (/^\s|^$|^#|^(def|class|import|from|async def|@)\b|^[)\]}]/.test(line)) continue
    return true
  }
  return false
}

export function CodeTracer({ code, onCodeChange, args: initialArgs = '', driver: initialDriver, stdin: initialStdin = '', autoRun, showAnalyze = true, onRunInputs, scrollOnRun, argsFor }: Props) {
  const [args, setArgs] = useState(initialArgs)
  const [driver, setDriver] = useState(initialDriver ?? '')
  const [stdin, setStdin] = useState(initialStdin)
  const detected: Mode = initialDriver ? 'driver' : looksLikeScript(code) ? 'script' : 'call'
  const [mode, setMode] = useState<Mode>(detected)
  const [touchedMode, setTouchedMode] = useState(false)
  // follow the code until the user picks a mode by hand
  useEffect(() => { if (!touchedMode && !initialDriver) setMode(looksLikeScript(code) ? 'script' : 'call') }, [code]) // eslint-disable-line react-hooks/exhaustive-deps
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [traced, setTraced] = useState<{ code: string; result: TraceResult; script: boolean } | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [busy, setBusy] = useState<'' | 'trace' | 'analyze'>('')
  const [error, setError] = useState('')
  const started = useRef(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const [showModes, setShowModes] = useState(false)
  const [showStdin, setShowStdin] = useState(!!initialStdin)
  const sig = signature(code)
  // pre-fill runnable sample arguments until the user types their own
  const params = sig?.params ?? ''
  // Who the current args belong to: '*' = trusted for any code, a parameter list = typed for
  // that function, null = our sample values. Args written for a different function are stale.
  const argsOwner = useRef<string | null>(initialArgs ? (argsFor === undefined ? '*' : argsFor) : null)
  useEffect(() => {
    if (mode !== 'call' || argsOwner.current === '*' || argsOwner.current === params) return
    argsOwner.current = null
    setArgs(sampleArgs(params))
  }, [params, mode])
  const autoArgs = argsOwner.current === null
  useEffect(() => { onRunInputs?.({ args, driver, stdin, argsFor: argsOwner.current ?? undefined }) }, [args, driver, stdin]) // eslint-disable-line react-hooks/exhaustive-deps
  const usesInput = /\binput\s*\(/.test(code)

  const visualize = async (manual = true) => {
    setBusy('trace')
    setError('')
    try {
      const payload = mode === 'script' ? { code, script: true, stdin } : mode === 'driver' ? { code, driver } : { code, args }
      const result: TraceResult = JSON.parse(await callPython('trace_json', JSON.stringify(payload)))
      if (!result.steps?.length) {
        setSteps(null)
        setTraced(null)
        setError(explainError(result.error ?? 'Nothing ran. Check the arguments.', mode))
      } else {
        setSteps(toSteps(result, code))
        setTraced({ code, result, script: mode === 'script' })
        if (!result.ok) setError(explainError(result.error ?? 'Error', mode))
        if (manual && scrollOnRun) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    } catch (e) {
      setError(explainError(e instanceof Error ? e.message : String(e), mode))
    } finally {
      setBusy('')
    }
  }

  const analyze = async () => {
    setBusy('analyze')
    try {
      setAnalysis(await analyzeCode(code))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  useEffect(() => {
    if (autoRun && !started.current) { started.current = true; visualize(false) }
  }, [autoRun]) // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!busy) visualize() }
  }

  const onTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKey(e)
    if (e.key !== 'Tab' || !onCodeChange) return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart: a, selectionEnd: b } = el
    onCodeChange(code.slice(0, a) + '    ' + code.slice(b))
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4 })
  }

  const result = traced?.result
  const stale = traced && traced.code !== code

  return (
    <div className="tracer">
      <div className="card tracer-input" onKeyDown={onKey}>
        {onCodeChange && (
          <>
            <div className="step-label"><span>1</span>Your code <span className="faint">(paste anything that runs: a script, functions, a class, a LeetCode solution)</span></div>
            <textarea
              className="editor" value={code} spellCheck={false} onKeyDown={onTab}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder={'# paste Python here, e.g.\nnums = [3, 1, 2]\nnums.sort()\nprint(nums)'}
            />
          </>
        )}

        <div className="step-label">
          <span>{onCodeChange ? 2 : 1}</span>How it runs
          <button className="hint-btn" onClick={() => setShowModes((v) => !v)}>{showModes ? 'hide options' : 'change'}</button>
        </div>
        {showModes && (
          <div className="mode-switch" role="tablist" aria-label="How to run">
            {([['script', 'Run as a script'], ['call', 'Call a function'], ['driver', 'Driver code']] as [Mode, string][]).map(([m, label]) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setTouchedMode(true) }}>{label}</button>
            ))}
          </div>
        )}
        {mode === 'script' && (
          <div className="run-how">
            <p>📄 <b>As a program:</b> runs the whole file top to bottom, like <code>python file.py</code>. Make sure something at the bottom actually runs (e.g. <code>print(...)</code>).</p>
            {usesInput || showStdin ? (
              <>
                <div className="faint" style={{ fontSize: 12.5, margin: '8px 0 4px' }}>Your code calls <code>input()</code>. Type what it should read, one line per call:</div>
                <textarea className="stdin" value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} placeholder={'first line\nsecond line'} />
              </>
            ) : (
              <button className="hint-btn" onClick={() => setShowStdin(true)}>+ add input for input()</button>
            )}
          </div>
        )}
        {mode === 'call' && (
          <div className="run-how">
            <p>🧩 <b>As a LeetCode-style function:</b> calls it with these arguments.{autoArgs && sig ? <span className="faint"> (Sample values filled in. Replace them with your own test case.)</span> : null}</p>
            <label className="call">
              <code>{sig ? sig.call : 'Solution().method'}(</code>
              <input value={args} onChange={(e) => { argsOwner.current = params; setArgs(e.target.value) }} spellCheck={false}
                placeholder={sig?.params || 'arguments'} onKeyDown={(e) => { if (e.key === 'Enter') visualize() }} />
              <code>)</code>
            </label>
          </div>
        )}
        {mode === 'driver' && (
          <div className="run-how">
            <p>🎛 <b>Driver code:</b> a few lines that create your object and call its methods (for design problems like MinStack or LRU Cache). The last line's value is shown as the result.</p>
            <textarea className="driver" value={driver} onChange={(e) => setDriver(e.target.value)} spellCheck={false} placeholder={'s = MinStack()\ns.push(3)\ns.getMin()'} />
          </div>
        )}

        <div className="step-label"><span>{onCodeChange ? 3 : 2}</span>Run it</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn primary big" onClick={() => visualize()} disabled={!!busy || !code.trim()}>
            {busy === 'trace' ? 'Running…' : steps ? '↻ Run again' : '▶ Visualize'}
          </button>
          {showAnalyze && (
            <button className="btn" onClick={analyze} disabled={!!busy || !code.trim()}>{busy === 'analyze' ? 'Analyzing…' : '⚡ Big-O'}</button>
          )}
          <span className="faint" style={{ fontSize: 12.5 }}>
            {busy ? 'The first run downloads Python (a few seconds)…' : <>or press <span className="kbd">Ctrl</span>/<span className="kbd">⌘</span> + <span className="kbd">Enter</span></>}
          </span>
        </div>
        {error && <div className="friendly-error">⚠️ {error}</div>}
        <details className="tips">
          <summary>Tips: writing arguments, trees, linked lists</summary>
          <ul>
            <li>Arguments are Python values, separated by commas: <code>[2, 7, 11, 15], 9</code> or <code>"abcabcbb"</code> (text needs quotes).</li>
            <li>TreeNode input: <code>tree([3, 9, 20, None, None, 15, 7])</code> (LeetCode's level-order list).</li>
            <li>ListNode input: <code>linked([1, 2, 3])</code>; add <code>pos=1</code> to make the tail point back (a cycle).</li>
            <li>Keep inputs small: animations stop after 1,500 steps.</li>
            <li>Python only (standard library). Everything runs in your browser; nothing is uploaded.</li>
          </ul>
        </details>
      </div>

      <div ref={resultRef} style={{ scrollMarginTop: 12 }} />
      {steps && traced && (
        <>
          {stale && <p className="faint" style={{ fontSize: 12.5 }}>The code changed since this run. Press Run again.</p>}
          <StepView
            code={traced.code}
            steps={steps}
            below={
              <div className="card panel">
                <div className="panel-title">Result</div>
                <div className="vars">
                  {traced.script
                    ? <span className="var">{result?.ok && !result.truncated ? '✓ program finished' : '✗ stopped early'}</span>
                    : <span className="var"><span className="k">returned = </span>{result?.ok ? showResult(result) : '—'}</span>}
                  <span className="var"><span className="k">steps = </span>{steps.length}{result?.truncated ? '+' : ''}</span>
                </div>
                {result?.truncated && <p className="error" style={{ marginBottom: 0 }}>Stopped after {steps.length} steps. Try a smaller input (or check for an infinite loop).</p>}
              </div>
            }
          />
        </>
      )}
      {analysis && <AnalysisCard analysis={analysis} />}
    </div>
  )
}
