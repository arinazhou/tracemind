import { useEffect, useMemo, useState } from 'react'
import type { Animation, Panel, Step } from '../engine/types'
import { CodeView } from './CodeView'
import { PanelView, TONE_LEGEND } from './PanelView'

const WIDE = new Set(['graph', 'grid', 'array'])

function runTrace(anim: Animation, text: string): { steps: Step[] } | { error: string } {
  try {
    const steps = anim.trace(JSON.parse(text))
    return steps.length ? { steps } : { error: 'The tracer produced no steps.' }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export function Player({ anim, initialStep = 0 }: { anim: Animation; initialStep?: number }) {
  const defaultText = useMemo(() => JSON.stringify(anim.defaultInput), [anim])
  const [text, setText] = useState(defaultText)
  const [result, setResult] = useState(() => runTrace(anim, defaultText))
  const [idx, setIdx] = useState(() => Math.max(0, initialStep || 0))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const steps = 'steps' in result ? result.steps : null
  const last = steps ? steps.length - 1 : 0
  const step = steps?.[Math.min(idx, last)]

  useEffect(() => {
    if (!playing) return
    if (idx >= last) { setPlaying(false); return }
    const id = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), 850 / speed)
    return () => clearTimeout(id)
  }, [playing, idx, last, speed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('textarea, input, select')) return
      if (e.key === 'ArrowRight') { setPlaying(false); setIdx((i) => Math.min(i + 1, last)) }
      else if (e.key === 'ArrowLeft') { setPlaying(false); setIdx((i) => Math.max(i - 1, 0)) }
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const rerun = (t: string) => {
    setText(t)
    setResult(runTrace(anim, t))
    setIdx(0)
    setPlaying(false)
  }

  const prevPanels = steps && idx > 0 ? steps[idx - 1].panels : undefined

  return (
    <div className="player">
      <div>
        <div className="card code-card">
          <CodeView code={anim.code} activeLine={step?.line} />
        </div>
        <div className="card input-editor">
          <div className="panel-title">Try your own input (JSON)</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => rerun(text)}>Re-run</button>
            <button className="btn" onClick={() => rerun(defaultText)}>Reset example</button>
            <button className="btn" onClick={() => rerun(JSON.stringify(anim.generate(10)))}>Random</button>
          </div>
          {anim.examples && (
            <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
              <span className="faint" style={{ fontSize: 12 }}>Presets:</span>
              {anim.examples.map((e) => (
                <button key={e.label} className="chip" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                  onClick={() => rerun(JSON.stringify(e.input))}>{e.label}</button>
              ))}
            </div>
          )}
          {'error' in result && <p className="error">{result.error}</p>}
        </div>
      </div>

      <div>
        <div className="controls">
          <button className="btn" onClick={() => { setPlaying(false); setIdx(0) }} disabled={!steps} title="Restart">⏮</button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)) }} disabled={!steps || idx === 0}>‹ Prev</button>
          <button className="btn primary" onClick={() => { if (idx >= last) setIdx(0); setPlaying((p) => !p) }} disabled={!steps} style={{ minWidth: 84 }}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)) }} disabled={!steps || idx >= last}>Next ›</button>
          <input
            type="range" min={0} max={last} value={idx} disabled={!steps}
            onChange={(e) => { setPlaying(false); setIdx(+e.target.value) }}
            aria-label="Step"
          />
          <label className="speed">
            speed
            <select value={speed} onChange={(e) => setSpeed(+e.target.value)}>
              {[0.5, 1, 1.5, 2, 4].map((s) => <option key={s} value={s}>{s}×</option>)}
            </select>
          </label>
        </div>

        <div className="card note-card" style={{ marginTop: 0, marginBottom: 14 }}>
          <div className="step-no">
            Step {steps ? idx + 1 : 0} / {steps?.length ?? 0} · line {step?.line ?? '—'}
            <span className="faint" style={{ float: 'right', fontWeight: 600 }}>
              <span className="kbd">←</span> <span className="kbd">→</span> step · <span className="kbd">space</span> play
            </span>
          </div>
          <p>{step?.note ?? '—'}</p>
        </div>

        {step && <Panels panels={step.panels} prev={prevPanels} />}

        <div className="legend">
          {TONE_LEGEND.map(([tone, label]) => (
            <span key={tone}><i className={`t-${tone}`} style={{ border: '1.5px solid' }} />{label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Wide panels (graph/grid/array) get a full row; small ones pair up. */
function Panels({ panels, prev }: { panels: Panel[]; prev?: Panel[] }) {
  const rows: Panel[][] = []
  for (const p of panels) {
    const lastRow = rows[rows.length - 1]
    if (!WIDE.has(p.kind) && lastRow && lastRow.length === 1 && !WIDE.has(lastRow[0].kind)) lastRow.push(p)
    else rows.push([p])
  }
  const prevOf = (p: Panel) => prev?.find((q) => q.title === p.title)
  return (
    <div className="viz">
      {rows.map((row, i) =>
        row.length === 2 ? (
          <div key={i} className="panel-pair">
            {row.map((p) => <PanelView key={p.title} panel={p} prev={prevOf(p)} />)}
          </div>
        ) : (
          <PanelView key={row[0].title} panel={row[0]} prev={prevOf(row[0])} />
        ),
      )}
    </div>
  )
}
