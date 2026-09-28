import { useEffect, useState } from 'react'
import { ANIMATIONS } from '../animations'
import { ComplexityView } from '../components/ComplexityView'
import { MySolution } from '../components/MySolution'
import { Player } from '../components/Player'
import { StatusSelect } from '../components/StatusSelect'
import { PROBLEMS, leetcodeUrl } from '../data/catalog'
import { update, useProgress } from '../data/progress'
import { catColors } from '../theme'

type Tab = 'animation' | 'complexity' | 'solution' | 'notes'

const TABS: Tab[] = ['animation', 'complexity', 'solution', 'notes']
const TAB_LABEL: Record<Tab, string> = { animation: '▶ Animation', complexity: '⏱ Complexity', solution: '⚡ My solution', notes: '✎ Notes' }

export function ProblemPage({ num, tab: tabParam, step = 0 }: { num: number; tab?: string | null; step?: number }) {
  const found = PROBLEMS.get(num)
  const anim = ANIMATIONS[num]
  const initialTab = (): Tab => (TABS.includes(tabParam as Tab) ? (tabParam as Tab) : anim ? 'animation' : 'solution')
  const [tab, setTab] = useState<Tab>(initialTab)
  useEffect(() => setTab(initialTab()), [num, anim, tabParam]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!found) return <p>Unknown problem.</p>
  const { problem: p, category: c } = found
  const col = catColors(c.hue)

  return (
    <>
      <div className="prob-head">
        <div>
          <a href={`#/c/${c.id}`} className="chip" style={{ background: col.wash, color: col.ink, marginBottom: 8 }}>← {c.title}</a>
          <h1 className="page-title"><span className="faint">{p.num}.</span> {p.title}</h1>
          <div className="row" style={{ marginTop: 8 }}>
            <span className={`chip diff-${p.difficulty}`}>{p.difficulty}</span>
            <StatusSelect num={p.num} />
          </div>
        </div>
        <a className="btn" href={leetcodeUrl(p)} target="_blank" rel="noreferrer">Solve on LeetCode ↗</a>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {(tab === 'animation' || tab === 'complexity') && !anim && (
        <div className="card placeholder">
          <h3>No animation yet</h3>
          <p className="muted">
            Save your solution under <b>My solution</b>, then run <code className="kbd">/animate {num}</code> in
            Claude Code. It writes a tracer that replays your code step by step and checks it before adding it here.
          </p>
        </div>
      )}
      {tab === 'animation' && anim && <Player key={num} anim={anim} initialStep={step} />}
      {tab === 'complexity' && anim && <ComplexityView key={num} anim={anim} />}
      {tab === 'solution' && <MySolution key={num} num={num} />}
      {tab === 'notes' && <Notes num={num} />}
    </>
  )
}

function Notes({ num }: { num: number }) {
  const progress = useProgress()
  const e = progress[num]
  return (
    <div>
      <textarea
        className="notes-area"
        placeholder="Key insight, edge cases, your own solution, mistakes to avoid…"
        value={e?.notes ?? ''}
        onChange={(ev) => update(num, { notes: ev.target.value })}
      />
      {e?.updatedAt ? (
        <p className="faint" style={{ fontSize: 12 }}>
          Last updated {new Date(e.updatedAt).toLocaleString()} · marked solved {e.solvedCount}×
        </p>
      ) : null}
    </div>
  )
}
