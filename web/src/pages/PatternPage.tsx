import { useEffect, useState } from 'react'
import { CodeView } from '../components/CodeView'
import { Demo } from '../components/learn/Demo'
import { ExampleDemo } from '../components/learn/ExampleDemo'
import { PracticeList } from '../components/learn/PracticeList'
import { ANIMATIONS } from '../animations'
import { useProgress } from '../data/progress'
import { DATA_STRUCTURES, EXAMPLES, PATTERNS, PROBLEMS, patternById, patternProblems } from '../learn'
import { catColors } from '../theme'

export function PatternPage({ id, focus }: { id: string; focus?: number }) {
  const p = patternById(id)
  const progress = useProgress()
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => { setOpen(null) }, [id])
  if (!p) return <p>Unknown lesson.</p>

  const i = PATTERNS.indexOf(p)
  const col = catColors(p.hue)
  const nums = patternProblems(p)
  const done = nums.filter((n) => progress[n]?.status === 'solved').length
  const example = EXAMPLES[p.id]
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k))
  const prev = PATTERNS[i - 1]
  const next = PATTERNS[i + 1]

  return (
    <div className="lesson">
      <div className="cat-head" style={{ background: col.wash }}>
        <div className="eyebrow" style={{ color: col.ink, opacity: 0.75 }}>Interview pattern {i + 1} of {PATTERNS.length}</div>
        <h1 className="page-title" style={{ color: col.ink }}>{p.title}</h1>
        <p style={{ margin: '6px 0 12px', color: col.ink, fontSize: 16, maxWidth: 760 }}>{p.short}</p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: col.ink }}>Built on (CS 225):</span>
          {p.ds.map((d) => {
            const ds = DATA_STRUCTURES.find((x) => x.id === d)
            return ds ? <a key={d} className="chip ds-chip" href={`#/ds/${d}`}>{ds.title}</a> : null
          })}
        </div>
        <div className="row" style={{ marginTop: 14, maxWidth: 420 }}>
          <div className="bar" style={{ flex: 1, background: 'rgba(255,255,255,.7)' }}><span style={{ width: `${(done / nums.length) * 100}%`, background: col.dot }} /></div>
          <b style={{ fontSize: 13, color: col.ink }}>{done}/{nums.length} done</b>
        </div>
      </div>

      <section className="lesson-section" style={{ paddingTop: 4 }}>
        <h2><span className="sec-n">1</span>Recognize it</h2>
        <ul className="signals">{p.signals.map((s) => <li key={s}>{s}</li>)}</ul>
        <p>{p.idea}</p>
      </section>

      <section className="lesson-section">
        <h2><span className="sec-n">2</span>Template{p.templates.length > 1 ? 's' : ''}</h2>
        {p.templates.map((t) => (
          <div key={t.name} className="card template">
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>{t.name}</h3>
            <div className="two-col template-body">
              <div className="card code-card" style={{ position: 'static', boxShadow: 'none' }}><CodeView code={t.code} /></div>
              <ol className="recipe">{t.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          </div>
        ))}
      </section>

      <section className="lesson-section">
        <h2><span className="sec-n">3</span>Watch it run</h2>
        <p>Real Python, executed line by line: arrays show index pointers, changed values light up, and trees and linked lists are drawn as structures.</p>
        {example && <ExampleDemo example={example} open={open === 'example'} onToggle={() => toggle('example')} />}
        {p.demos?.filter((n) => ANIMATIONS[n]).map((n) => (
          <Demo key={n} num={n} title={PROBLEMS.get(n)?.problem.title ?? ''} open={open === `d${n}`} onToggle={() => toggle(`d${n}`)} />
        ))}
        {p.id === 'dfs' || p.id === 'bfs' ? (
          <div className="callout callout-tip"><b>💡 Trees get their own page</b><p>Traversals, the four tree templates, BSTs, and tree Big-O are covered in depth on <a className="lc-link" href="#/ds/trees">Trees &amp; BSTs</a>.</p></div>
        ) : null}
      </section>

      <section className="lesson-section">
        <h2><span className="sec-n">4</span>Complexity</h2>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="ptable cx-table">
            <thead><tr><th>Operation</th><th>Time</th><th>Extra space</th><th>Why</th></tr></thead>
            <tbody>{p.complexity.map(([op, t, s, why]) => <tr key={op}><td>{op}</td><td>{t}</td><td>{s}</td><td>{why}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="faint" style={{ fontSize: 13 }}>Paste your own solution into the <a className="lc-link" href="#/visualize">Code Visualizer</a> (or a problem's My solution tab) to get this analysis for your code.</p>
      </section>

      <section className="lesson-section">
        <h2><span className="sec-n">5</span>Strategies &amp; pitfalls</h2>
        <div className="tricks">
          {p.tips.map((t, k) => <div key={t} className="card trick"><span className="trick-n">{k + 1}</span><p style={{ margin: 0 }}>{t}</p></div>)}
        </div>
        {p.cs225 && <div className="callout callout-cs225"><b>📘 CS 225 connection</b><p>{p.cs225}</p></div>}
      </section>

      <section className="lesson-section">
        <h2><span className="sec-n">6</span>Practice</h2>
        <p>In order. Name the template before you code; open a hint only after you're stuck. Check a problem off when LeetCode accepts it.</p>
        <PracticeList focus={focus} stages={p.stages.map((s) => ({ title: s.title, items: s.items.map(([num, , , hint, tag]) => ({ num, hint, template: tag ?? '' })) }))} />
      </section>

      <nav className="lesson-nav">
        {prev ? <a className="card" href={`#/learn/${prev.id}`}><span className="faint">← Previous</span><b>{prev.title}</b></a> : <span />}
        {next ? <a className="card" href={`#/learn/${next.id}`} style={{ textAlign: 'right' }}><span className="faint">Next →</span><b>{next.title}</b></a> : <span />}
      </nav>
    </div>
  )
}
