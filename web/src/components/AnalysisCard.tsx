import type { Analysis } from '../data/progress'

const norm = (s?: string) => (s ?? '').replace(/\s+/g, '')

/** Big-O verdict + the line-by-line reasons behind it. */
export function AnalysisCard({ analysis, reference }: { analysis: Analysis; reference?: string }) {
  if (!analysis.ok) return <div className="card panel error">{analysis.error}</div>
  return (
    <div className="card panel analysis">
      <div className="panel-title" style={{ justifyContent: 'space-between' }}>
        <span>Big-O estimate for <code>{analysis.function}()</code></span>
        <span className={`conf conf-${analysis.confidence}`}>{analysis.confidence} confidence</span>
      </div>
      <div className="verdict">
        <div><div className="eyebrow">Time</div><div className="cx-big">{analysis.time}</div></div>
        <div><div className="eyebrow">Space</div><div className="cx-big">{analysis.space}</div></div>
      </div>
      {reference && (norm(reference) === norm(analysis.time)
        ? <div className="compare ok">✓ Matches the reference solution ({reference}).</div>
        : <div className="compare diff">The reference solution runs in {reference}. Compare the hot lines below.</div>)}
      <div style={{ marginTop: 10 }}>
        {analysis.findings!.map((f, i) => (
          <div key={i} className="finding">
            <span className="ln-ref">line {f.line}</span>
            <span className="cost">{f.cost}</span>
            <span>{f.message}</span>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, margin: '8px 0 0' }}>
        Static analysis of loops, recursion and library calls. It says "medium/low confidence" when it had to guess.
      </p>
    </div>
  )
}
