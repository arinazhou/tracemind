import { useEffect, useRef } from 'react'

const KEYWORDS = /\b(def|class|for|in|if|else|elif|while|return|and|or|not|from|import|continue|break|None|True|False|self|lambda)\b/g

/** Tiny Python highlighter: keywords, strings, comments, numbers. */
function highlight(line: string) {
  const out: (string | JSX.Element)[] = []
  const commentAt = line.indexOf('#')
  const body = commentAt >= 0 ? line.slice(0, commentAt) : line
  const re = new RegExp(`${KEYWORDS.source}|("[^"]*"|'[^']*')|(\\b\\d+\\b)`, 'g')
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    if (m.index > last) out.push(body.slice(last, m.index))
    const color = m[1] ? '#7c5cd6' : m[2] ? '#2a8a5d' : '#c0672a'
    out.push(<span key={m.index} style={{ color, fontWeight: m[1] ? 600 : undefined }}>{m[0]}</span>)
    last = m.index + m[0].length
  }
  out.push(body.slice(last))
  if (commentAt >= 0) out.push(<span key="c" style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>{line.slice(commentAt)}</span>)
  return out
}

interface Props {
  code: string
  activeLine?: number
  /** Optional per-line execution counts, rendered as a heat gutter. */
  heat?: number[]
  /** Optional per-line tags, e.g. Big-O costs from the analyzer. */
  annotations?: Record<number, string>
}

export function CodeView({ code, activeLine, heat, annotations }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lines = code.replace(/\s+$/, '').split('\n')
  const maxHeat = heat ? Math.max(1, ...heat) : 1

  useEffect(() => {
    const el = ref.current?.querySelector('.hl')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeLine])

  return (
    <div className="code" ref={ref}>
      {lines.map((text, i) => {
        const n = i + 1
        const h = heat?.[n] ?? 0
        return (
          <div
            key={n}
            className={`code-line${n === activeLine ? ' hl' : ''}`}
            style={heat && h ? { background: `rgba(124, 108, 214, ${0.06 + 0.34 * (h / maxHeat)})` } : undefined}
          >
            {heat && <span className="heat">{h ? `×${h}` : ''}</span>}
            <span className="ln">{n}</span>
            <span>{highlight(text)}</span>
            {annotations?.[n] && <span className="cost-tag">{annotations[n]}</span>}
          </div>
        )
      })}
    </div>
  )
}
