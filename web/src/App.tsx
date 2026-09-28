import { useEffect, useSyncExternalStore } from 'react'
import { ANIMATIONS } from './animations'
import { CATEGORIES } from './data/catalog'
import { connect, reconnectIfOffline, useProgress, useSync } from './data/progress'
import { CategoryPage } from './pages/CategoryPage'
import { Home } from './pages/Home'
import { ProblemPage } from './pages/ProblemPage'
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

  let page = <Home />
  if (kind === 'c' && arg) page = <CategoryPage id={arg} />
  if (kind === 'p' && arg) page = <ProblemPage num={+arg} tab={params.get('tab')} step={Number(params.get('step') ?? 1) - 1} />

  const activeCat = kind === 'c' ? arg : undefined
  const animated = CATEGORIES.flatMap((c) => c.problems).filter((p) => ANIMATIONS[p.num])

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
          <span>
            Tracemind
            <span className="brand-sub">see your code think</span>
          </span>
        </a>
        <a href="#/" className={`nav-item${!kind ? ' on' : ''}`}>Dashboard</a>
        <div className="nav-label">Animated</div>
        {animated.map((p) => (
          <a key={p.num} href={`#/p/${p.num}`} className={`nav-item${kind === 'p' && +arg === p.num ? ' on' : ''}`}>
            <span className="faint" style={{ fontSize: 12, width: 28 }}>{p.num}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
          </a>
        ))}
        <div className="nav-label">Patterns</div>
        {CATEGORIES.map((c) => {
          const done = c.problems.filter((p) => progress[p.num]?.status === 'solved').length
          return (
            <a key={c.id} href={`#/c/${c.id}`} className={`nav-item${activeCat === c.id ? ' on' : ''}`}>
              <span className="nav-dot" style={{ background: catColors(c.hue).dot }} />
              {c.title}
              <span className="nav-count">{done}/{c.problems.length}</span>
            </a>
          )
        })}
        <button
          className={`sync sync-${sync}`}
          onClick={() => sync === 'offline' && connect()}
          title={sync === 'offline' ? 'Server not reachable. Click to retry.' : undefined}
        >
          <i />{SYNC_LABEL[sync]}
        </button>
      </aside>
      <main className="main">{page}</main>
    </div>
  )
}
