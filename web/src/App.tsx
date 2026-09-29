import { useEffect, useSyncExternalStore } from 'react'
import { BackupButtons } from './components/BackupButtons'
import { SearchBox } from './components/SearchBox'
import { connect, reconnectIfOffline, useProgress, useSync } from './data/progress'
import { DATA_STRUCTURES, PATTERNS, patternProblems } from './learn'
import { DSPage } from './pages/DSPage'
import { Home } from './pages/Home'
import { LabPage } from './pages/LabPage'
import { PatternPage } from './pages/PatternPage'
import { ProblemPage } from './pages/ProblemPage'
import { TrackerPage } from './pages/TrackerPage'
import { catColors } from './theme'

function useHash() {
  return useSyncExternalStore(
    (l) => { window.addEventListener('hashchange', l); return () => window.removeEventListener('hashchange', l) },
    () => window.location.hash || '#/',
  )
}

const SYNC_LABEL = {
  connecting: 'Connecting…',
  synced: 'Synced',
  saving: 'Saving…',
  offline: 'Offline · saved in browser',
  local: 'Saved in this browser',
}

// links from before the Learn / CS 225 restructure
const LEGACY: Record<string, string> = {
  'binary-tree': '#/ds/trees', 'dfs-backtracking': '#/learn/backtracking', trees: '#/ds/trees',
}

export function App() {
  const hash = useHash()
  const progress = useProgress()
  const sync = useSync()
  const [path, query = ''] = hash.split('?')
  const params = new URLSearchParams(query)
  const [, kind, arg] = path.split('/')
  // braces matter: newer Chrome returns a Promise from scrollTo, and React would call it as a cleanup
  useEffect(() => { window.scrollTo(0, 0) }, [hash])

  useEffect(() => {
    connect()
    // retry when the tab regains focus (e.g. after starting the server)
    window.addEventListener('focus', reconnectIfOffline)
    return () => window.removeEventListener('focus', reconnectIfOffline)
  }, [])

  useEffect(() => {
    if ((kind === 'c' || kind === 'learn') && arg && LEGACY[arg]) window.location.replace(LEGACY[arg])
    else if (kind === 'c' && arg) window.location.replace(`#/learn/${arg}`)
  }, [kind, arg])

  let page = <Home />
  if (kind === 'learn' && arg) page = <PatternPage id={arg} focus={Number(params.get('focus')) || undefined} />
  if (kind === 'ds' && arg) page = <DSPage id={arg} />
  if (kind === 'lab' || kind === 'visualize') page = <LabPage />
  if (kind === 'tracker') page = <TrackerPage />
  if (kind === 'p' && arg) page = <ProblemPage num={+arg} tab={params.get('tab')} step={Number(params.get('step') ?? 1) - 1} />

  return (
    <div className="shell">
      <aside className="sidebar">
        <a href="#/" className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M4 17 L9 9 L14 13 L20 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="5" r="2.2" fill="currentColor" />
            </svg>
          </span>
          <span>Tracemind<span className="brand-sub">see your code think</span></span>
        </a>
        <SearchBox />
        <div className="nav-top">
          <a href="#/" className={`nav-item${!kind ? ' on' : ''}`}>Home</a>
          <a href="#/visualize" className={`nav-item${kind === 'lab' || kind === 'visualize' ? ' on' : ''}`}>▶ Visualize my code</a>
          <a href="#/tracker" className={`nav-item${kind === 'tracker' ? ' on' : ''}`}>✓ Tracker</a>
        </div>

        <div className="nav-label">Learn · interview patterns</div>
        {PATTERNS.map((p, i) => {
          const nums = [...new Set(patternProblems(p))]
          const d = nums.filter((n) => progress[n]?.status === 'solved').length
          return (
            <a key={p.id} href={`#/learn/${p.id}`} className={`nav-item${kind === 'learn' && arg === p.id ? ' on' : ''}`}>
              <span className="nav-num">{i + 1}</span>
              <span className="nav-dot" style={{ background: catColors(p.hue).dot }} />
              {p.title}
              <span className="nav-count">{d}/{nums.length}</span>
            </a>
          )
        })}

        <div className="nav-label">Data structures · CS 225</div>
        {DATA_STRUCTURES.map((d) => (
          <a key={d.id} href={`#/ds/${d.id}`} className={`nav-item${kind === 'ds' && arg === d.id ? ' on' : ''}`}>
            <span className="nav-dot" style={{ background: catColors(d.hue).dot }} />{d.title}
          </a>
        ))}

        <button className={`sync sync-${sync}`} onClick={() => sync === 'offline' && connect()} title={sync === 'offline' ? 'Server not reachable. Click to retry.' : undefined}>
          <i />{SYNC_LABEL[sync]}
        </button>
        <BackupButtons />
      </aside>
      <main className="main">{page}</main>
    </div>
  )
}
