import type { ArrayPanel, GraphPanel, GridPanel, ListPanel, MapPanel, Panel, VarsPanel } from '../engine/types'

const tc = (tone?: string) => (tone ? ` t-${tone}` : '')

export function PanelView({ panel, prev }: { panel: Panel; prev?: Panel }) {
  return (
    <div className="card panel">
      <div className="panel-title">
        {panel.title}
        {panel.aux && <span className="aux-tag" title="Counts toward auxiliary space">extra space</span>}
      </div>
      {panel.kind === 'array' && <ArrayView p={panel} />}
      {panel.kind === 'graph' && <GraphView p={panel} />}
      {panel.kind === 'grid' && <GridView p={panel} />}
      {panel.kind === 'list' && <ListView p={panel} />}
      {panel.kind === 'map' && <MapView p={panel} />}
      {panel.kind === 'vars' && <VarsView p={panel} prev={prev?.kind === 'vars' ? prev : undefined} />}
    </div>
  )
}

function ArrayView({ p }: { p: ArrayPanel }) {
  const ptrAt: Record<number, string[]> = {}
  Object.entries(p.pointers ?? {}).forEach(([name, i]) => { (ptrAt[i] ??= []).push(name) })
  const max = Math.max(1, ...p.values.map((v) => (typeof v === 'number' ? v : 0)))
  const inWin = (i: number) => p.window && i >= p.window[0] && i <= p.window[1]
  const px = (v: string | number) => Math.max(14, (Number(v) / max) * 150)
  // water level between the window's two walls (bar charts only)
  const water = p.bars && p.window ? Math.min(px(p.values[p.window[0]]), px(p.values[p.window[1]])) : 0
  return (
    <div className="arr">
      {p.values.map((v, i) => (
        <div key={i} className={`arr-col${inWin(i) ? ' in-window' : ''}`}>
          <div className="arr-ptr">{ptrAt[i]?.join(' ') ?? ''}</div>
          {p.bars ? (
            <div className="bars">
              {water > 0 && inWin(i) && <div className="water" style={{ height: water }} />}
              <div className={`bar-col${tc(p.tones?.[i])}`} style={{ height: px(v) }}>{v}</div>
            </div>
          ) : (
            <div className={`cell${tc(p.tones?.[i])}`}>{v}</div>
          )}
          <div className="arr-idx">{i}</div>
        </div>
      ))}
      {p.values.length === 0 && <span className="empty">empty</span>}
    </div>
  )
}

function GridView({ p }: { p: GridPanel }) {
  const cols = p.cells[0]?.length ?? 0
  return (
    <div className="grid-v" style={{ gridTemplateColumns: `repeat(${cols}, 38px)` }}>
      {p.cells.flatMap((row, r) =>
        row.map((v, c) => {
          const cursor = p.cursor && p.cursor[0] === r && p.cursor[1] === c
          return (
            <div key={`${r},${c}`} className={`cell${tc(p.tones?.[`${r},${c}`])}${cursor ? ' cursor' : ''}`}>
              {v}
            </div>
          )
        }),
      )}
    </div>
  )
}

function ListView({ p }: { p: ListPanel }) {
  return (
    <div className="row" style={{ alignItems: p.style === 'stack' ? 'flex-end' : 'center' }}>
      {p.style === 'queue' && <span className="lst-end">front</span>}
      <div className={`lst ${p.style}`}>
        {p.items.length === 0 && <span className="empty">empty</span>}
        {p.items.map((v, i) => (
          <div key={`${i}-${v}`} className={`cell${i === p.highlight ? ' t-active' : ' t-visited'}`}>{v}</div>
        ))}
      </div>
      {p.style === 'queue' && p.items.length > 0 && <span className="lst-end">back</span>}
      {p.style === 'stack' && p.items.length > 0 && <span className="lst-end">← top</span>}
    </div>
  )
}

function MapView({ p }: { p: MapPanel }) {
  if (!p.entries.length) return <span className="empty">empty</span>
  return (
    <div className="kv">
      {p.entries.map(([k, v]) => {
        const hl = k === p.highlightKey || String(k) === String(p.highlightKey)
        return [
          <span key={`k${k}`} className={`k${hl ? ' hl' : ''}`}>{JSON.stringify(k)}</span>,
          <span key={`v${k}`} className={hl ? 'hl' : ''}>{String(v)}</span>,
        ]
      })}
    </div>
  )
}

function VarsView({ p, prev }: { p: VarsPanel; prev?: VarsPanel }) {
  return (
    <div className="vars">
      {Object.entries(p.vars).map(([k, v]) => {
        const changed = prev && k in prev.vars && prev.vars[k] !== v
        return (
          <span key={k} className={`var${changed ? ' changed' : ''}`}>
            <span className="k">{k} = </span>{v === null ? '—' : String(v)}
          </span>
        )
      })}
    </div>
  )
}

const W = 560, H = 260, PAD = 34, R = 17

function GraphView({ p }: { p: GraphPanel }) {
  const pos = new Map(p.nodes.map((n) => [n.id, { x: PAD + n.x * (W - 2 * PAD), y: PAD / 2 + n.y * (H - PAD) }]))
  return (
    <svg className="graph-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={p.title}>
      <defs>
        {['base', 'active'].map((k) => (
          <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={k === 'active' ? 'var(--active-fg)' : '#cfc7bc'} />
          </marker>
        ))}
      </defs>
      {p.edges.map(([a, b], i) => {
        const s = pos.get(a), e = pos.get(b)
        if (!s || !e) return null
        const dx = e.x - s.x, dy = e.y - s.y
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len, uy = dy / len
        const active = p.edgeTones?.[`${a}->${b}`] === 'active'
        return (
          <line
            key={i}
            className={`edge${active ? ' e-active' : ''}`}
            x1={s.x + ux * R} y1={s.y + uy * R}
            x2={e.x - ux * (R + 3)} y2={e.y - uy * (R + 3)}
            markerEnd={p.directed ? `url(#arrow-${active ? 'active' : 'base'})` : undefined}
          />
        )
      })}
      {p.nodes.map((n) => {
        const { x, y } = pos.get(n.id)!
        const tone = p.nodeTones?.[n.id]
        return (
          <g key={n.id} className={`node${tone ? ` n-${tone}` : ''}`}>
            <circle cx={x} cy={y} r={R} />
            <text x={x} y={y}>{n.label ?? n.id}</text>
            {n.badge !== undefined && (
              <g className="badge">
                <circle cx={x + R * 0.85} cy={y - R * 0.85} r={8.5} />
                <text x={x + R * 0.85} y={y - R * 0.85}>{n.badge}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export const TONE_LEGEND: [string, string][] = [
  ['active', 'current'],
  ['visited', 'queued / on stack'],
  ['warn', 'being checked'],
  ['match', 'found / unlocked'],
  ['done', 'finished'],
  ['dim', 'out of play'],
]
