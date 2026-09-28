import { useState } from 'react'
import { ANIMATIONS } from '../animations'
import { analyzeCode, update, useProgress, type Analysis } from '../data/progress'
import { CodeView } from './CodeView'

const norm = (s?: string) => (s ?? '').replace(/\s+/g, '')

export function MySolution({ num }: { num: number }) {
  const progress = useProgress()
  const code = progress[num]?.solution ?? ''
  const anim = ANIMATIONS[num]
  const [result, setResult] = useState<Analysis | null>(null)
  const [analyzed, setAnalyzed] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      setResult(await analyzeCode(code))
      setAnalyzed(code)
    } catch {
      setError('The analyzer needs the backend. Start it with ./dev.sh')
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart: a, selectionEnd: b } = el
    update(num, { solution: code.slice(0, a) + '    ' + code.slice(b) })
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4 })
  }

  const tags: Record<number, string> = {}
  result?.findings?.forEach((f) => { if (f.cost !== 'O(1)') tags[f.line] = f.cost })
  const ref = anim?.complexity

  return (
    <div className="sol-grid">
      <div>
        <textarea
          className="editor"
          value={code}
          onChange={(e) => update(num, { solution: e.target.value })}
          onKeyDown={onKeyDown}
          spellCheck={false}
          placeholder={'class Solution:\n    def solve(self, nums):\n        ...'}
        />
        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={run} disabled={!code.trim() || busy}>
            {busy ? 'Analyzing…' : '⚡ Analyze complexity'}
          </button>
          {anim && !code.trim() && (
            <button className="btn" onClick={() => update(num, { solution: anim.code })}>Start from the reference solution</button>
          )}
          <span className="faint" style={{ fontSize: 12 }}>Autosaves · Tab inserts 4 spaces</span>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {!result && (
          <div className="card panel">
            <div className="panel-title">How this works</div>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              The analyzer parses your Python and recognizes the building blocks of interview solutions:
              loops over the input, constant 4-direction loops, BFS queues, amortized monotonic stacks,
              halving (binary search), sorting and heap calls, memoized vs. branching recursion. Each
              conclusion is pinned to the line that caused it.
            </p>
            <p className="muted" style={{ margin: '10px 0 0', fontSize: 14 }}>
              Want this solution animated? In Claude Code, run <code className="kbd">/animate {num}</code>.
            </p>
          </div>
        )}
        {result && !result.ok && <div className="card panel error">{result.error}</div>}
        {result?.ok && (
          <>
            <div className="card panel">
              <div className="panel-title" style={{ justifyContent: 'space-between' }}>
                <span>Estimate for <code>{result.function}()</code></span>
                <span className={`conf conf-${result.confidence}`}>{result.confidence} confidence</span>
              </div>
              <div className="verdict">
                <div><div className="eyebrow">Time</div><div className="cx-big">{result.time}</div></div>
                <div><div className="eyebrow">Space</div><div className="cx-big">{result.space}</div></div>
              </div>
              {ref && (
                norm(ref.time) === norm(result.time)
                  ? <div className="compare ok">✓ Matches the reference solution's time complexity ({ref.time}).</div>
                  : <div className="compare diff">The reference solution runs in {ref.time}. Compare the hot lines below.</div>
              )}
              {analyzed !== code && <p className="faint" style={{ fontSize: 12, margin: '10px 0 0' }}>You've edited the code since this analysis. Re-run it to update.</p>}
            </div>
            <div className="card panel">
              <div className="panel-title">Why</div>
              {result.findings!.map((f, i) => (
                <div key={i} className="finding">
                  <span className="ln-ref">line {f.line}</span>
                  <span className="cost">{f.cost}</span>
                  <span>{f.message}</span>
                </div>
              ))}
            </div>
            <div className="card code-card" style={{ position: 'static' }}>
              <CodeView code={analyzed} annotations={tags} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
