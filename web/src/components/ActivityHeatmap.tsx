import { useEffect, useState } from 'react'
import { fetchActivity, useProgress, type DayActivity } from '../data/progress'

const WEEKS = 26
// one hue, light → dark (sequential); level 0 is the empty surface
const RAMP = ['var(--surface-2)', '#e4dcfb', '#c7b8f4', '#a08ce6', '#7c6cd6']

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function ActivityHeatmap() {
  const progress = useProgress()
  const [data, setData] = useState<Map<string, DayActivity> | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  // refetch whenever progress changes, so today's square lights up live
  useEffect(() => {
    fetchActivity().then((rows) => setData(new Map(rows.map((r) => [r.day, r])))).catch(() => setData(null))
  }, [progress])

  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)
  const days: Date[] = []
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) days.push(new Date(d))

  const max = Math.max(1, ...[...(data?.values() ?? [])].map((d) => d.count))
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)))

  let streak = 0
  for (let d = new Date(today); data?.get(iso(d))?.count; d.setDate(d.getDate() - 1)) streak++

  const h = hover ? data?.get(hover) : undefined
  const fmt = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="card hero-card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="muted" style={{ fontWeight: 700 }}>Activity</span>
        <span className="faint" style={{ fontSize: 13, fontWeight: 700 }}>
          {data ? <>🔥 {streak}-day streak</> : 'Start the backend to track activity'}
        </span>
      </div>
      <div className="heat-wrap">
        <div className="heat-grid" role="img" aria-label={`Activity over the last ${WEEKS} weeks`}>
          {days.map((d) => {
            const key = iso(d)
            const n = data?.get(key)?.count ?? 0
            return (
              <div
                key={key}
                className="heat-cell"
                style={{ background: RAMP[level(n)] }}
                onPointerEnter={() => setHover(key)}
                onPointerLeave={() => setHover(null)}
              />
            )
          })}
        </div>
      </div>
      <div className="heat-legend">
        <span style={{ marginRight: 'auto', color: 'var(--ink-2)', fontWeight: 600 }}>
          {hover ? <><b>{fmt(hover)}</b> · {h?.count ?? 0} update{h?.count === 1 ? '' : 's'}{h?.solved ? `, ${h.solved} solved` : ''}</> : 'Hover a day'}
        </span>
        less {RAMP.map((c) => <span key={c} className="heat-cell" style={{ background: c }} />)} more
      </div>
    </div>
  )
}
