import { CodeView } from '../components/CodeView'
import { CS225_SLIDES } from '../learn/dataStructures'
import { DATA_STRUCTURES, dsById, patternById } from '../learn'
import { catColors } from '../theme'
import { LearnTrees } from './LearnTrees'

export function DSPage({ id }: { id: string }) {
  const d = dsById(id)
  if (!d) return <p>Unknown data structure.</p>
  if (d.id === 'trees') return <LearnTrees />
  const col = catColors(d.hue)
  const i = DATA_STRUCTURES.indexOf(d)

  return (
    <div className="lesson">
      <div className="cat-head" style={{ background: col.wash }}>
        <div className="eyebrow" style={{ color: col.ink, opacity: 0.75 }}>Data structure {i + 1} of {DATA_STRUCTURES.length} · CS 225 reference</div>
        <h1 className="page-title" style={{ color: col.ink }}>{d.title}</h1>
        <p style={{ margin: '6px 0 0', color: col.ink, fontSize: 16, maxWidth: 760 }}>{d.short}</p>
      </div>

      <p style={{ fontSize: 15.5, lineHeight: 1.65, maxWidth: 820 }}>{d.what}</p>

      <div className="two-col">
        <div>
          <div className="panel-title">In Python</div>
          <div className="card code-card" style={{ position: 'static' }}><CodeView code={d.python} /></div>
        </div>
        <div>
          <div className="panel-title">Operations</div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="ptable cx-table">
              <thead><tr><th>Operation</th><th>Cost</th><th>Note</th></tr></thead>
              <tbody>{d.ops.map(([op, c, n]) => <tr key={op}><td>{op}</td><td>{c}</td><td className="muted">{n}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <h2 className="ds-h">Key ideas from CS 225</h2>
      <ul className="cx-why" style={{ fontSize: 15, maxWidth: 880 }}>{d.ideas.map((x) => <li key={x}>{x}</li>)}</ul>

      <div className="two-col" style={{ marginTop: 22 }}>
        <div className="card panel">
          <div className="panel-title">Interview patterns that use it</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {d.patterns.map((pid) => {
              const p = patternById(pid)
              return p ? <a key={pid} className="chip pattern-chip" href={`#/learn/${pid}`}>{p.title} →</a> : null
            })}
          </div>
        </div>
        <div className="card panel">
          <div className="panel-title">CS 225 lecture slides (Spring 2024)</div>
          <ul className="slide-links">
            {d.lectures.map(([title, file]) => (
              <li key={file}><a className="lc-link" href={`${CS225_SLIDES}${file}-slides.pdf`} target="_blank" rel="noreferrer">{title} ↗</a></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
