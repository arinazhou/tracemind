import { useState } from 'react'
import { ANIMATIONS } from '../../animations'
import { PROBLEMS, leetcodeUrl } from '../../data/catalog'
import { useProgress } from '../../data/progress'
import { StatusSelect } from '../StatusSelect'

export interface PracticeItem { num: number; template: string; hint: string }
export interface Stage { title: string; goal: string; items: PracticeItem[] }

export function PracticeList({ stages }: { stages: Stage[] }) {
  const progress = useProgress()
  const [shown, setShown] = useState<Record<number, boolean>>({})
  const all = stages.flatMap((s) => s.items)
  const done = all.filter((i) => progress[i.num]?.status === 'solved').length

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="row">
        <div className="bar" style={{ flex: 1 }}><span style={{ width: `${(done / all.length) * 100}%`, background: 'var(--done-fg)' }} /></div>
        <b style={{ fontSize: 13 }}>{done} / {all.length} solved</b>
      </div>
      {stages.map((s) => (
        <div key={s.title} className="card" style={{ overflowX: 'auto' }}>
          <div className="stage-head"><b>{s.title}</b><span className="muted">{s.goal}</span></div>
          <table className="ptable practice-table">
            <colgroup><col style={{ width: 64 }} /><col /><col style={{ width: 96 }} /><col style={{ width: 150 }} /><col style={{ width: 110 }} /></colgroup>
            <tbody>
              {s.items.map((it) => {
                const found = PROBLEMS.get(it.num)
                if (!found) return null
                const p = found.problem
                return (
                  <tr key={it.num}>
                    <td className="num">{p.num}</td>
                    <td className="title-cell">
                      <a href={`#/p/${p.num}`}>{p.title}</a>
                      {ANIMATIONS[p.num] && <span className="anim-badge">▶ animated</span>}
                      <div className="hint-row">
                        <span className="tmpl">{it.template}</span>
                        {shown[it.num]
                          ? <span className="muted">{it.hint}</span>
                          : <button className="hint-btn" onClick={() => setShown({ ...shown, [it.num]: true })}>show hint</button>}
                      </div>
                    </td>
                    <td><span className={`chip diff-${p.difficulty}`}>{p.difficulty}</span></td>
                    <td><StatusSelect num={p.num} /></td>
                    <td><a className="lc-link" href={leetcodeUrl(p)} target="_blank" rel="noreferrer">LeetCode ↗</a></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
