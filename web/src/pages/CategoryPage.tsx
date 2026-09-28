import { ANIMATIONS } from '../animations'
import { CATEGORIES, leetcodeUrl } from '../data/catalog'
import { useProgress } from '../data/progress'
import { StatusSelect } from '../components/StatusSelect'
import { catColors } from '../theme'

export function CategoryPage({ id }: { id: string }) {
  const progress = useProgress()
  const c = CATEGORIES.find((x) => x.id === id)
  if (!c) return <p>Unknown category.</p>
  const col = catColors(c.hue)
  const done = c.problems.filter((p) => progress[p.num]?.status === 'solved').length

  return (
    <>
      <div className="cat-head" style={{ background: col.wash }}>
        <div className="eyebrow" style={{ color: col.ink, opacity: 0.7 }}>Pattern</div>
        <h1 className="page-title" style={{ color: col.ink }}>{c.title}</h1>
        <p style={{ margin: '6px 0 14px', color: col.ink }}>{c.blurb}</p>
        <div className="bar" style={{ background: 'rgba(255,255,255,.7)', maxWidth: 360 }}>
          <span style={{ width: `${(done / c.problems.length) * 100}%`, background: col.dot }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: col.ink, marginTop: 6 }}>{done} of {c.problems.length} solved</div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="ptable">
          <thead>
            <tr><th>#</th><th>Problem</th><th>Difficulty</th><th>Status</th><th>LeetCode</th></tr>
          </thead>
          <tbody>
            {c.problems.map((p) => (
              <tr key={p.num}>
                <td className="num">{p.num}</td>
                <td className="title-cell">
                  <a href={`#/p/${p.num}`}>{p.title}</a>
                  {ANIMATIONS[p.num] && <span className="anim-badge">▶ animated</span>}
                  {progress[p.num]?.notes && <span className="faint" title="Has notes" style={{ marginLeft: 8 }}>✎</span>}
                </td>
                <td><span className={`chip diff-${p.difficulty}`}>{p.difficulty}</span></td>
                <td><StatusSelect num={p.num} /></td>
                <td><a className="lc-link" href={leetcodeUrl(p)} target="_blank" rel="noreferrer">Open ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
