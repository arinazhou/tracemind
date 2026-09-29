import { useEffect, useState } from 'react'
import { ANIMATIONS } from '../../animations'
import { PROBLEMS, leetcodeUrl } from '../../data/catalog'
import { useProgress } from '../../data/progress'
import { DoneToggle } from '../DoneToggle'

export interface PracticeItem { num: number; template: string; hint: string }
export interface Stage { title: string; goal?: string; items: PracticeItem[] }

export function PracticeList({ stages, focus }: { stages: Stage[]; focus?: number }) {
  const progress = useProgress()
  const [shown, setShown] = useState<Record<number, boolean>>({})
  const [flash, setFlash] = useState<number | null>(null)

  // arriving from search: scroll to the problem and highlight it for a moment
  useEffect(() => {
    if (!focus) return
    const toRow = setTimeout(() => {
      document.querySelector(`tr[data-num="${focus}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlash(focus)
    }, 80) // after the router's scroll-to-top
    const fade = setTimeout(() => setFlash(null), 2800)
    return () => { clearTimeout(toRow); clearTimeout(fade) }
  }, [focus])
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
          <div className="stage-head"><b>{s.title}</b>{s.goal && <span className="muted">{s.goal}</span>}</div>
          <table className="ptable practice-table">
            <colgroup><col style={{ width: 170 }} /><col style={{ width: 60 }} /><col /><col style={{ width: 96 }} /><col style={{ width: 110 }} /></colgroup>
            <tbody>
              {s.items.map((it) => {
                const found = PROBLEMS.get(it.num)
                if (!found) return null
                const p = found.problem
                return (
                  <tr key={it.num} data-num={it.num} className={flash === it.num ? 'focused' : undefined}>
                    <td><DoneToggle num={p.num} /></td>
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
