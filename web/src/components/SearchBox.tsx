import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from '../data/progress'
import { search, type SearchHit } from '../learn/search'
import { catColors } from '../theme'

/** Where a hit takes you. Problems open their TOPIC lesson, scrolled to the problem. */
function hrefOf(h: SearchHit, openProblem = false): string {
  if (h.kind === 'problem') return openProblem ? `#/p/${h.problem.num}` : `#/learn/${h.pattern.id}?focus=${h.problem.num}`
  if (h.kind === 'pattern') return `#/learn/${h.pattern.id}`
  return `#/ds/${h.id}`
}

/** Sidebar button + quick-search panel (⌘K or / to open). */
export function SearchBox() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const progress = useProgress()
  const hits = useMemo(() => search(q, 12), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('textarea, input, select')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { if (open) { setSel(0); requestAnimationFrame(() => input.current?.select()) } }, [open])
  useEffect(() => { setSel(0) }, [q])

  const go = (h: SearchHit | undefined, openProblem = false) => {
    if (!h) return
    window.location.hash = hrefOf(h, openProblem)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(hits[sel], e.metaKey || e.ctrlKey) }
  }

  const leetcodeSearch = `https://leetcode.com/problemset/?search=${encodeURIComponent(q.trim())}`

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)}>
        <span aria-hidden="true">🔍</span> Search problems…
        <span className="kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
      </button>

      {open && (
        <div className="search-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="search-panel card" role="dialog" aria-label="Search" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
            <input
              ref={input}
              className="search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="LeetCode number or title, e.g. 207, 3sum, lru, longest substring, dijkstra"
              aria-label="Search"
            />
            <div className="search-results" role="listbox">
              {!q.trim() && (
                <p className="search-empty">
                  Type a problem number or part of its title. Pick a result to jump to <b>the topic that teaches it</b>, with
                  the problem highlighted in the practice list.
                </p>
              )}
              {q.trim() && (hits.length === 0 || (hits[0].kind === 'problem' && hits[0].partial)) && (
                <p className="search-empty">
                  "{q}" isn't in Tracemind's 210 problems yet.{' '}
                  <a className="lc-link" href={leetcodeSearch} target="_blank" rel="noreferrer">Search it on LeetCode ↗</a>
                  {hits.length > 0 && <><br /><b>Related problems below</b>: their topic is probably the one to study.</>}
                </p>
              )}
              {hits.map((h, i) => {
                const active = i === sel
                const common = { role: 'option', 'aria-selected': active, className: `search-hit${active ? ' on' : ''}`, onMouseEnter: () => setSel(i) }
                if (h.kind === 'problem') {
                  const done = progress[h.problem.num]?.status === 'solved'
                  const col = catColors(h.pattern.hue)
                  return (
                    <a key={`p${h.problem.num}`} {...common} href={hrefOf(h)} onClick={(e) => { e.preventDefault(); go(h, e.metaKey || e.ctrlKey) }}>
                      <span className="hit-num">{h.problem.num}</span>
                      <span className="hit-title">{h.problem.title}{done && <span className="hit-done" title="Done">✓</span>}</span>
                      <span className={`chip diff-${h.problem.difficulty}`}>{h.problem.difficulty}</span>
                      <span className="hit-topic" style={{ background: col.wash, color: col.ink }}>→ {h.pattern.title}</span>
                    </a>
                  )
                }
                const title = h.kind === 'pattern' ? h.pattern.title : h.title
                const sub = h.kind === 'pattern' ? `Interview pattern · ${h.pattern.short}` : `CS 225 data structure · ${h.short}`
                return (
                  <a key={`${h.kind}${title}`} {...common} href={hrefOf(h)} onClick={(e) => { e.preventDefault(); go(h) }}>
                    <span className="hit-num">{h.kind === 'pattern' ? '📘' : '📚'}</span>
                    <span className="hit-title">{title}<span className="hit-sub">{sub}</span></span>
                  </a>
                )
              })}
            </div>
            <div className="search-foot">
              <span><span className="kbd">↑</span> <span className="kbd">↓</span> move</span>
              <span><span className="kbd">Enter</span> open topic</span>
              <span><span className="kbd">⌘</span>+<span className="kbd">Enter</span> open problem page</span>
              <span><span className="kbd">Esc</span> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
