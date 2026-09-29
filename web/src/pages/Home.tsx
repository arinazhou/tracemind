import { SignInPrompt } from '../components/Account'
import { useProgress } from '../data/progress'
import { DATA_STRUCTURES, PATTERNS, PROBLEMS, patternProblems } from '../learn'
import { catColors } from '../theme'

export function Home() {
  const progress = useProgress()
  const all = [...PROBLEMS.values()]
  const done = all.filter(({ problem }) => progress[problem.num]?.status === 'solved')
  const count = (d: string) => [done.filter((x) => x.problem.difficulty === d).length, all.filter((x) => x.problem.difficulty === d).length]
  const stats = PATTERNS.map((p) => {
    const nums = [...new Set(patternProblems(p))]
    return { p, total: nums.length, done: nums.filter((n) => progress[n]?.status === 'solved').length }
  })
  const next = stats.find((s) => s.done < s.total) ?? stats[0]
  const recent = done
    .map((x) => ({ ...x, at: progress[x.problem.num]?.solvedAt ?? '' }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  return (
    <>
      <div className="eyebrow">Tracemind · LeetCode + CS 225</div>
      <h1 className="page-title">See your code think.</h1>
      <p className="muted" style={{ margin: '6px 0 0', maxWidth: 720 }}>
        Learn the 20 interview patterns with templates and animations, look up the data structures underneath them the
        CS 225 way, and paste any Python you write to watch it run line by line and get its Big-O.
      </p>

      <SignInPrompt />

      <div className="hero">
        <div className="card hero-card">
          <div className="muted" style={{ fontWeight: 700 }}>Interview track</div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span className="big-num">{done.length}</span>
            <span className="faint" style={{ fontWeight: 700 }}>/ {all.length} problems</span>
          </div>
          <div className="bar" style={{ marginTop: 14 }}>
            <span style={{ width: `${(done.length / all.length) * 100}%`, background: 'linear-gradient(90deg, #c9bdf5, #a8d5f5, #a9e2c6)' }} />
          </div>
          <div className="stat-row">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
              const [s, t] = count(d)
              return <div key={d}><span className={`chip diff-${d}`}>{d}</span><div><b>{s}</b> <span className="faint">/ {t}</span></div></div>
            })}
          </div>
          <a className="btn primary" href={`#/learn/${next.p.id}`} style={{ marginTop: 18 }}>
            Continue: {PATTERNS.indexOf(next.p) + 1}. {next.p.title} →
          </a>
        </div>
        <div className="card hero-card tools-card">
          <a href="#/visualize" className="tool">
            <span className="tool-icon">▶</span>
            <span><b>Code Visualizer</b><span className="muted">If it runs, it visualizes: any Python, line by line, plus Big-O.</span></span>
          </a>
          <a href="#/tracker" className="tool">
            <span className="tool-icon">✓</span>
            <span><b>Tracker</b><span className="muted">Done, date, and a note for every problem, with LeetCode links.</span></span>
          </a>
          {recent.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div className="faint" style={{ fontSize: 12, fontWeight: 700, margin: '4px 0' }}>RECENTLY FINISHED</div>
              <ul className="recent">
                {recent.map(({ problem, pattern, at }) => (
                  <li key={problem.num}>
                    <a href={`#/p/${problem.num}`}>
                      <span className="nav-dot" style={{ background: catColors(pattern.hue).dot }} />
                      <span className="faint">{problem.num}.</span> {problem.title}
                      <span className="faint" style={{ marginLeft: 'auto', fontSize: 12 }}>{at}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h2 className="home-h">Interview patterns <span className="faint">· the main track</span></h2>
      <div className="cat-grid">
        {stats.map(({ p, total, done: d }, i) => {
          const col = catColors(p.hue)
          return (
            <a key={p.id} href={`#/learn/${p.id}`} className="card cat-card" style={{ borderTop: `4px solid ${col.dot}` }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3><span className="faint" style={{ marginRight: 6 }}>{i + 1}</span>{p.title}</h3>
              </div>
              <p>{p.short}</p>
              <div className="row" style={{ fontSize: 12, fontWeight: 700 }}><span className="muted">{d} / {total} done</span></div>
              <div className="bar"><span style={{ width: `${(d / total) * 100}%`, background: col.dot }} /></div>
            </a>
          )
        })}
      </div>

      <h2 className="home-h">Data structures <span className="faint">· CS 225 reference</span></h2>
      <div className="ds-grid">
        {DATA_STRUCTURES.map((d) => (
          <a key={d.id} href={`#/ds/${d.id}`} className="card ds-card" style={{ borderLeft: `4px solid ${catColors(d.hue).dot}` }}>
            <b>{d.title}</b>
            <span className="muted">{d.short}</span>
          </a>
        ))}
      </div>
    </>
  )
}
