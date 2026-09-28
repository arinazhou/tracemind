import { useEffect, useState } from 'react'
import { ANIMATIONS } from '../animations'
import { ComplexityView } from '../components/ComplexityView'
import { DoneToggle } from '../components/DoneToggle'
import { MySolution } from '../components/MySolution'
import { Player } from '../components/Player'
import { update, useProgress } from '../data/progress'
import { PROBLEMS, leetcodeUrl } from '../learn'
import { catColors } from '../theme'

type Tab = 'animation' | 'complexity' | 'solution' | 'notes'
const TAB_LABEL: Record<Tab, string> = { animation: '▶ Animation', complexity: '⏱ Complexity', solution: '⚡ My solution', notes: '✎ Notes' }

export function ProblemPage({ num, tab: tabParam, step = 0 }: { num: number; tab?: string | null; step?: number }) {
  const found = PROBLEMS.get(num)
  const anim = ANIMATIONS[num]
  const tabs: Tab[] = anim ? ['animation', 'complexity', 'solution', 'notes'] : ['solution', 'notes']
  const initialTab = (): Tab => (tabs.includes(tabParam as Tab) ? (tabParam as Tab) : tabs[0])
  const [tab, setTab] = useState<Tab>(initialTab)
  const [hint, setHint] = useState(false)
  useEffect(() => { setTab(initialTab()); setHint(false) }, [num, tabParam]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!found) return <p>Unknown problem.</p>
  const { problem: p, pattern } = found
  const col = catColors(pattern.hue)

  return (
    <>
      <div className="prob-head">
        <div>
          <a href={`#/learn/${pattern.id}`} className="chip" style={{ background: col.wash, color: col.ink, marginBottom: 8 }}>← Lesson: {pattern.title}</a>
          <h1 className="page-title"><span className="faint">{p.num}.</span> {p.title}</h1>
          <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <span className={`chip diff-${p.difficulty}`}>{p.difficulty}</span>
            {p.tag && <span className="tmpl">{p.tag}</span>}
            <DoneToggle num={p.num} />
            {hint ? <span className="muted" style={{ fontSize: 14 }}>💡 {p.hint}</span>
              : <button className="hint-btn" onClick={() => setHint(true)}>show hint</button>}
          </div>
        </div>
        <a className="btn primary" href={leetcodeUrl(p)} target="_blank" rel="noreferrer">Solve on LeetCode ↗</a>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{TAB_LABEL[t]}</button>
        ))}
      </div>

      {tab === 'animation' && anim && <Player key={num} anim={anim} initialStep={step} />}
      {tab === 'complexity' && anim && <ComplexityView key={num} anim={anim} />}
      {tab === 'solution' && <MySolution key={num} num={num} />}
      {tab === 'notes' && <Notes num={num} />}
    </>
  )
}

function Notes({ num }: { num: number }) {
  const e = useProgress()[num]
  return (
    <div>
      <textarea
        className="notes-area"
        placeholder="Key insight, edge cases, mistakes to avoid…"
        value={e?.notes ?? ''}
        onChange={(ev) => update(num, { notes: ev.target.value })}
      />
      {e?.solvedAt && <p className="faint" style={{ fontSize: 12 }}>Finished on {e.solvedAt}.</p>}
    </div>
  )
}
