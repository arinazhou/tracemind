import { useEffect, useState, type ReactNode } from 'react'
import type { Panel, Step } from '../engine/types'
import { CodeView } from './CodeView'
import { PanelView, TONE_LEGEND } from './PanelView'

const WIDE = new Set(['graph', 'grid', 'array'])

interface Props {
  code: string
  steps: Step[] | null
  initialStep?: number
  /** Rendered under the code (e.g. an input editor). */
  below?: ReactNode
}

/** Code with a highlighted line + step controls + visual panels. Used by every animation. */
export function StepView({ code, steps, initialStep = 0, below }: Props) {
  const [idx, setIdx] = useState(() => Math.max(0, initialStep || 0))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const last = steps ? steps.length - 1 : 0
  const step = steps?.[Math.min(idx, last)]

  // new trace → start from the top
  useEffect(() => { setIdx(Math.max(0, Math.min(initialStep || 0, last))); setPlaying(false) }, [steps]) // eslint-disable-line react-hooks/exhaustive-deps

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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const prevPanels = steps && idx > 0 ? steps[idx - 1].panels : undefined

  return (
    <div className="player">
      <div>
        <div className="card code-card"><CodeView code={code} activeLine={step?.line} /></div>
        {below}
      </div>
      <div>
        <div className="controls">
          <button className="btn" onClick={() => { setPlaying(false); setIdx(0) }} disabled={!steps} title="Restart">⏮</button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)) }} disabled={!steps || idx === 0}>‹ Prev</button>
          <button className="btn primary" onClick={() => { if (idx >= last) setIdx(0); setPlaying((p) => !p) }} disabled={!steps} style={{ minWidth: 84 }}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)) }} disabled={!steps || idx >= last}>Next ›</button>
          <input type="range" min={0} max={last} value={idx} disabled={!steps} onChange={(e) => { setPlaying(false); setIdx(+e.target.value) }} aria-label="Step" />
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
          <p>{step ? withCode(step.note) : '—'}</p>
        </div>
        {step && <Panels panels={step.panels} prev={prevPanels} />}
        <div className="legend">
          {TONE_LEGEND.map(([tone, label]) => <span key={tone}><i className={`t-${tone}`} style={{ border: '1.5px solid' }} />{label}</span>)}
        </div>
      </div>
    </div>
  )
}

/** Render `backtick` spans in notes as inline code. */
function withCode(note: string) {
  return note.split('`').map((part, i) => (i % 2 ? <code key={i} className="note-code">{part}</code> : part))
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
          <div key={i} className="panel-pair">{row.map((p) => <PanelView key={p.title} panel={p} prev={prevOf(p)} />)}</div>
        ) : (
          <PanelView key={row[0].title + i} panel={row[0]} prev={prevOf(row[0])} />
        ),
      )}
    </div>
  )
}
