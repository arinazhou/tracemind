import { useState } from 'react'

export interface Series {
  name: string
  values: number[]
  style: 'solid' | 'dash' | 'dot'
}

const STROKE: Record<Series['style'], { color: string; dash?: string; width: number }> = {
  solid: { color: '#7c6cd6', width: 2 },
  dash: { color: '#8f877e', dash: '6 4', width: 2 },
  dot: { color: '#c9a58c', dash: '2 4', width: 2 },
}

const W = 520, H = 250, M = { t: 16, r: 110, b: 30, l: 46 }

function niceMax(v: number) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v)!
}

export function GrowthChart({ xs, series, yLabel }: { xs: number[]; series: Series[]; yLabel: string }) {
  const [hover, setHover] = useState<number | null>(null)
  // y-domain follows the measured + fit curves; the contrast curve may run off the top (clipped)
  const yMax = niceMax(Math.max(...series.filter((s) => s.style !== 'dot').flatMap((s) => s.values)) * 1.15)
  const xMax = xs[xs.length - 1]
  const sx = (x: number) => M.l + (x / xMax) * (W - M.l - M.r)
  const sy = (y: number) => H - M.b - (y / yMax) * (H - M.t - M.b)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const clipId = `clip-${yLabel}`

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    xs.forEach((v, i) => { if (Math.abs(sx(v) - x) < Math.abs(sx(xs[best]) - x)) best = i })
    setHover(best)
  }

  // direct labels at the right end, nudged apart so they don't collide
  const ends = series
    .map((s) => ({ s, y: Math.max(M.t, Math.min(sy(s.values[s.values.length - 1]), H - M.b)) }))
    .sort((a, b) => a.y - b.y)
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${series.map((s) => s.name).join(', ')} by input size`}>
        <defs>
          <clipPath id={clipId}><rect x={M.l} y={M.t - 2} width={W - M.l - M.r} height={H - M.t - M.b + 2} /></clipPath>
        </defs>
        <g className="chart-grid">
          {ticks.map((t) => <line key={t} x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} />)}
        </g>
        <g className="chart-axis">
          {ticks.map((t) => <text key={t} x={M.l - 8} y={sy(t)} textAnchor="end" dominantBaseline="central">{Math.round(t)}</text>)}
          {xs.filter((_, i) => i % 2 === 1 || i === 0).map((x) => (
            <text key={x} x={sx(x)} y={H - M.b + 18} textAnchor="middle">{x}</text>
          ))}
          <text x={M.l} y={M.t - 4} style={{ fontSize: 10 }}>{yLabel}</text>
        </g>
        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => {
            const st = STROKE[s.style]
            return (
              <polyline
                key={s.name}
                points={s.values.map((v, i) => `${sx(xs[i])},${sy(v)}`).join(' ')}
                fill="none" stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash}
                strokeLinecap="round" strokeLinejoin="round"
              />
            )
          })}
          {series[0].values.map((v, i) => (
            <circle key={i} cx={sx(xs[i])} cy={sy(v)} r={hover === i ? 5 : 3.5} fill={STROKE.solid.color} stroke="white" strokeWidth={2} />
          ))}
        </g>
        {ends.map(({ s, y }) => (
          <text key={s.name} x={W - M.r + 8} y={y} dominantBaseline="central" style={{ fontSize: 11, fill: 'var(--ink-2)', fontWeight: 600 }}>
            {s.name}
          </text>
        ))}
        {hover !== null && (
          <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={M.t} y2={H - M.b} stroke="var(--ink-3)" strokeWidth={1} />
        )}
        <rect
          x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: `${(sx(xs[hover]) / W) * 100}%`, top: `${(M.t / H) * 100}%`, transform: 'translate(-50%, 0)' }}>
          <div className="faint" style={{ marginBottom: 4 }}>n = {xs[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="tt-row">
              <span className={`key${s.style !== 'solid' ? ' dash' : ''}`} style={{ borderColor: STROKE[s.style].color }} />
              <b>{Math.round(s.values[hover])}</b>
              <span className="faint">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <div className="legend" style={{ marginTop: 6 }}>
        {series.map((s) => (
          <span key={s.name}>
            <svg width="18" height="6"><line x1="0" x2="18" y1="3" y2="3" stroke={STROKE[s.style].color} strokeWidth="2" strokeDasharray={STROKE[s.style].dash} /></svg>
            {s.name}
          </span>
        ))}
      </div>
      <details className="table-view">
        <summary>Show numbers</summary>
        <table>
          <thead><tr><th>n</th>{series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead>
          <tbody>
            {xs.map((x, i) => (
              <tr key={x}><td>{x}</td>{series.map((s) => <td key={s.name}>{Math.round(s.values[i])}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
