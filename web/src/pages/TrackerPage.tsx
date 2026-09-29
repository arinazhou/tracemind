import { useState } from 'react'
import { SignInPrompt } from '../components/Account'
import { DoneToggle } from '../components/DoneToggle'
import { update, useProgress } from '../data/progress'
import { PATTERNS, PROBLEMS, leetcodeUrl, patternProblems } from '../learn'

type Filter = 'all' | 'todo' | 'done'

/** Deliberately small: done ✓ + date, a one-line note, and the LeetCode link. */
export function TrackerPage() {
  const progress = useProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const all = [...PROBLEMS.values()]
  const doneCount = all.filter(({ problem }) => progress[problem.num]?.status === 'solved').length
  const query = q.trim().toLowerCase()

  const matches = (num: number) => {
    const { problem } = PROBLEMS.get(num)!
    const done = progress[num]?.status === 'solved'
    if (filter === 'done' && !done) return false
    if (filter === 'todo' && done) return false
    return !query || `${num}. ${problem.title} ${progress[num]?.notes ?? ''}`.toLowerCase().includes(query)
  }

  return (
    <div className="lesson">
      <div className="eyebrow">Tools</div>
      <h1 className="page-title">Tracker</h1>
      <p className="lede">Solve on LeetCode, then check it off here. Checking stamps today's date (you can edit it), and the note field is for the one thing you want to remember.</p>
      <SignInPrompt text="Signed out, this list is saved only in this browser." />
      <div className="row tracker-bar">
        <b>{doneCount} / {all.length} done</b>
        <div className="tabs" style={{ margin: 0 }}>
          {(['all', 'todo', 'done'] as Filter[]).map((f) => (
            <button key={f} className={`tab${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f === 'todo' ? 'To do' : f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <input className="tracker-search" placeholder="Search number, title, or notes" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {PATTERNS.map((p) => {
        const nums = [...new Set(patternProblems(p))].filter((n) => PROBLEMS.get(n)?.pattern === p && matches(n))
        if (!nums.length) return null
        const d = nums.filter((n) => progress[n]?.status === 'solved').length
        return (
          <div key={p.id} className="card tracker-group">
            <div className="stage-head"><a href={`#/learn/${p.id}`}><b>{p.title}</b></a><span className="muted">{d}/{nums.length}</span></div>
            <table className="ptable tracker-table">
              <colgroup><col style={{ width: 170 }} /><col style={{ width: 56 }} /><col /><col style={{ width: 90 }} /><col style={{ width: '30%' }} /><col style={{ width: 110 }} /></colgroup>
              <tbody>
                {nums.map((n) => {
                  const { problem } = PROBLEMS.get(n)!
                  return (
                    <tr key={n}>
                      <td><DoneToggle num={n} /></td>
                      <td className="num">{n}</td>
                      <td className="title-cell"><a href={`#/p/${n}`}>{problem.title}</a></td>
                      <td><span className={`chip diff-${problem.difficulty}`}>{problem.difficulty}</span></td>
                      <td>
                        <input className="note-input" placeholder="note…" value={progress[n]?.notes ?? ''}
                          onChange={(e) => update(n, { notes: e.target.value })} />
                      </td>
                      <td><a className="lc-link" href={leetcodeUrl(problem)} target="_blank" rel="noreferrer">LeetCode ↗</a></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
