import { useEffect, useRef, useState } from 'react'
import { analyzeCode, type Analysis } from '../data/progress'
import type { Step } from '../engine/types'
import { callPython } from '../lab/pyWorker'
import { showResult, toSteps, type TraceResult } from '../lab/traceToSteps'
import { AnalysisCard } from './AnalysisCard'
import { StepView } from './StepView'

interface Props {
  code: string
  /** Makes the code editable; called on every edit. */
  onCodeChange?: (code: string) => void
  args?: string
  driver?: string
  autoRun?: boolean
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

export function CodeTracer({ code, onCodeChange, args: initialArgs = '', driver: initialDriver, autoRun, showAnalyze = true }: Props) {
  const [args, setArgs] = useState(initialArgs)
  const [driver, setDriver] = useState(initialDriver ?? '')
  const [useDriver, setUseDriver] = useState(!!initialDriver)
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [traced, setTraced] = useState<{ code: string; result: TraceResult } | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [busy, setBusy] = useState<'' | 'trace' | 'analyze'>('')
  const [error, setError] = useState('')
  const started = useRef(false)
  const sig = signature(code)

  const visualize = async () => {
    setBusy('trace')
    setError('')
    try {
      const payload = useDriver ? { code, driver } : { code, args }
      const result: TraceResult = JSON.parse(await callPython('trace_json', JSON.stringify(payload)))
      if (!result.steps?.length) {
        setSteps(null)
        setTraced(null)
        setError(result.error ?? 'Nothing ran. Check the arguments.')
      } else {
        setSteps(toSteps(result, code))
        setTraced({ code, result })
        if (!result.ok) setError(result.error ?? 'Error')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
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
    if (autoRun && !started.current) { started.current = true; visualize() }
  }, [autoRun]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <div className="card tracer-input">
        {onCodeChange && (
          <textarea
            className="editor" value={code} spellCheck={false} onKeyDown={onTab}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder={'class Solution:\n    def solve(self, nums):\n        ...'}
          />
        )}
        <div className="call-row">
          {useDriver ? (
            <textarea className="driver" value={driver} onChange={(e) => setDriver(e.target.value)} spellCheck={false}
              placeholder={'s = MinStack()\ns.push(3)\ns.getMin()'} />
          ) : (
            <label className="call">
              <code>{sig ? sig.call : 'Solution().method'}(</code>
              <input value={args} onChange={(e) => setArgs(e.target.value)} spellCheck={false}
                placeholder={sig?.params || 'arguments'} onKeyDown={(e) => { if (e.key === 'Enter') visualize() }} />
              <code>)</code>
            </label>
          )}
        </div>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          <button className="btn primary" onClick={visualize} disabled={!!busy || !code.trim()}>
            {busy === 'trace' ? 'Running…' : steps ? '↻ Re-run' : '▶ Visualize'}
          </button>
          {showAnalyze && (
            <button className="btn" onClick={analyze} disabled={!!busy || !code.trim()}>{busy === 'analyze' ? 'Analyzing…' : '⚡ Big-O'}</button>
          )}
          <label className="faint" style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={useDriver} onChange={(e) => setUseDriver(e.target.checked)} />
            driver code (for design problems: several calls)
          </label>
          {busy && <span className="faint" style={{ fontSize: 12.5 }}>The first run downloads Python (a few seconds)…</span>}
        </div>
        <p className="faint tracer-help">
          Arguments are Python: <code>[2, 7, 11, 15], 9</code>. Trees: <code>tree([3, 9, 20, None, None, 15, 7])</code>. Linked
          lists: <code>linked([1, 2, 3])</code> (add <code>pos=1</code> for a cycle). Everything runs in your browser.
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      {steps && traced && (
        <>
          {stale && <p className="faint" style={{ fontSize: 12.5 }}>The code changed since this run. Press Re-run.</p>}
          <StepView
            code={traced.code}
            steps={steps}
            below={
              <div className="card panel">
                <div className="panel-title">Result</div>
                <div className="vars">
                  <span className="var"><span className="k">returned = </span>{result?.ok ? showResult(result) : '—'}</span>
                  <span className="var"><span className="k">steps = </span>{steps.length}{result?.truncated ? '+' : ''}</span>
                </div>
                {result?.truncated && <p className="error" style={{ marginBottom: 0 }}>Stopped after {steps.length} steps. Try a smaller input (or check for an infinite loop).</p>}
                {result?.stdout && <pre className="stdout">{result.stdout}</pre>}
              </div>
            }
          />
        </>
      )}
      {analysis && <AnalysisCard analysis={analysis} />}
    </div>
  )
}
