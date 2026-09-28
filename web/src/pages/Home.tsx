import { ANIMATIONS } from '../animations'
import { CATEGORIES, PROBLEMS } from '../data/catalog'
import { useProgress } from '../data/progress'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { catColors } from '../theme'

export function Home() {
  const progress = useProgress()
  const all = CATEGORIES.flatMap((c) => c.problems)
  const solved = all.filter((p) => progress[p.num]?.status === 'solved')
  const byDiff = (d: string) => [solved.filter((p) => p.difficulty === d).length, all.filter((p) => p.difficulty === d).length]
  const review = all.filter((p) => progress[p.num]?.status === 'review').length
  const recent = Object.entries(progress)
    .filter(([num]) => PROBLEMS.has(+num))
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, 5)

  return (
    <>
      <div className="eyebrow">Tracemind · your algorithm lab</div>
      <h1 className="page-title">See your code think.</h1>
      <p className="muted" style={{ margin: '6px 0 0', maxWidth: 640 }}>Track every pattern, replay solutions line by line, and get an explained Big-O for your own Python.</p>

      <div className="hero">
        <div className="card hero-card">
          <div className="muted" style={{ fontWeight: 700 }}>Solved</div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span className="big-num">{solved.length}</span>
            <span className="faint" style={{ fontWeight: 700 }}>/ {all.length}</span>
          </div>
          <div className="bar" style={{ marginTop: 14 }}>
            <span style={{ width: `${(solved.length / all.length) * 100}%`, background: 'linear-gradient(90deg, #c9bdf5, #a8d5f5, #a9e2c6)' }} />
          </div>
          <div className="stat-row">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
              const [s, t] = byDiff(d)
              return <div key={d}><span className={`chip diff-${d}`}>{d}</span><div><b>{s}</b> <span className="faint">/ {t}</span></div></div>
            })}
            <div><span className="chip st-review">Review</span><div><b>{review}</b></div></div>
            <div><span className="chip" style={{ background: 'var(--active-bg)', color: 'var(--active-fg)' }}>Animated</span><div><b>{Object.keys(ANIMATIONS).length}</b></div></div>
          </div>
        </div>
        <ActivityHeatmap />
      </div>

      <a href="#/learn/trees" className="card learn-banner">
        <span className="learn-icon" aria-hidden="true">🌳</span>
        <span>
          <b>New lesson: Trees, from "a little" to LeetCode mediums</b>
          <span className="muted">Traversals, 4 templates, BSTs, Big-O, a quiz, and a practice path. Every step animated.</span>
        </span>
        <span className="lc-link" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Start →</span>
      </a>

      <div className="card continue">
        <span className="muted" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Continue</span>
        {recent.length === 0 ? (
          <span className="faint" style={{ fontSize: 14 }}>
            Nothing yet. Try <a className="lc-link" href="#/p/207">207. Course Schedule</a> to watch a BFS topological sort step by step.
          </span>
        ) : (
          recent.map(([num, e]) => {
            const { problem, category } = PROBLEMS.get(+num)!
            return (
              <a key={num} href={`#/p/${num}`} className="continue-item">
                <span className="nav-dot" style={{ background: catColors(category.hue).dot }} />
                <span className="faint">{num}.</span> {problem.title}
                <span className={`chip st-${e.status}`}>{e.status}</span>
              </a>
            )
          })
        )}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Patterns</h2>
      <div className="cat-grid">
        {CATEGORIES.map((c) => {
          const done = c.problems.filter((p) => progress[p.num]?.status === 'solved').length
          const anim = c.problems.filter((p) => ANIMATIONS[p.num]).length
          const col = catColors(c.hue)
          return (
            <a key={c.id} href={`#/c/${c.id}`} className="card cat-card" style={{ borderTop: `4px solid ${col.dot}` }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>{c.title}</h3>
                {anim > 0 && <span className="anim-badge" style={{ margin: 0 }}>{anim} animated</span>}
              </div>
              <p>{c.blurb}</p>
              <div className="row" style={{ fontSize: 12, fontWeight: 700 }}>
                <span className="muted">{done} / {c.problems.length} solved</span>
              </div>
              <div className="bar"><span style={{ width: `${(done / c.problems.length) * 100}%`, background: col.dot }} /></div>
            </a>
          )
        })}
      </div>
    </>
  )
}
