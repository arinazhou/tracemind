import { useMemo, useState } from 'react'
import { auxSize } from '../engine/tracer'
import type { Animation, GrowthClass } from '../engine/types'
import { CodeView } from './CodeView'
import { GrowthChart, type Series } from './GrowthChart'

const SIZES = [8, 16, 24, 32, 48, 64, 80, 96, 112, 128]
const RUNS = 3

const F: Record<GrowthClass, (n: number) => number> = {
  '1': () => 1,
  'log n': (n) => Math.log2(Math.max(2, n)),
  n: (n) => n,
  'n log n': (n) => n * Math.log2(Math.max(2, n)),
  'n^2': (n) => n * n,
}
const LABEL: Record<GrowthClass, string> = { '1': 'O(1)', 'log n': 'O(log n)', n: 'O(n)', 'n log n': 'O(n log n)', 'n^2': 'O(n²)' }
/** A slower class to contrast with, so the "fast" curve has something to beat. */
const CONTRAST: Partial<Record<GrowthClass, GrowthClass>> = { '1': 'n', 'log n': 'n', n: 'n^2', 'n log n': 'n^2' }

/** Least-squares scale c so that c·f(n) fits the measurements. */
function fit(xs: number[], ys: number[], f: (n: number) => number) {
  const num = xs.reduce((s, x, i) => s + ys[i] * f(x), 0)
  const den = xs.reduce((s, x) => s + f(x) ** 2, 0)
  const c = num / den
  return xs.map((x) => c * f(x))
}

function measure(anim: Animation) {
  const time: number[] = []
  const space: number[] = []
  for (const n of SIZES) {
    let t = 0, s = 0
    for (let r = 0; r < RUNS; r++) {
      const steps = anim.trace(anim.generate(n))
      t += steps.length
      s += Math.max(0, ...steps.map(auxSize))
    }
    time.push(Math.round(t / RUNS))
    space.push(Math.round(s / RUNS))
  }
  return { time, space }
}

function seriesFor(ys: number[], cls: GrowthClass): Series[] {
  const out: Series[] = [
    { name: 'measured', values: ys, style: 'solid' },
    { name: `${LABEL[cls]} fit`, values: fit(SIZES, ys, F[cls]), style: 'dash' },
  ]
  const slower = CONTRAST[cls]
  if (slower) {
    // anchor the contrast curve at the first measurement so they start together
    const k = ys[0] / F[slower](SIZES[0])
    out.push({ name: `if it were ${LABEL[slower]}`, values: SIZES.map((x) => k * F[slower](x)), style: 'dot' })
  }
  return out
}

export function ComplexityView({ anim }: { anim: Animation }) {
  const [seed, setSeed] = useState(0)
  const data = useMemo(() => measure(anim), [anim, seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const heat = useMemo(() => {
    const counts: number[] = []
    for (const s of anim.trace(anim.defaultInput)) counts[s.line] = (counts[s.line] ?? 0) + 1
    return counts
  }, [anim])
  const cx = anim.complexity

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="cx-grid">
        <div className="card cx-hero">
          <div className="eyebrow">Time</div>
          <div className="cx-big">{cx.time}</div>
          <ul className="cx-why">{cx.why.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
        <div className="card cx-hero">
          <div className="eyebrow">Space (extra)</div>
          <div className="cx-big">{cx.space}</div>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Measured as the peak number of items held by the structures marked
            <span className="aux-tag" style={{ margin: '0 4px' }}>extra space</span>
            in the animation. The input itself is not counted.
          </p>
        </div>
      </div>

      <div className="cx-grid">
        <div className="card panel">
          <div className="panel-title">Steps executed vs. input size · x = {cx.sizeLabel}</div>
          <GrowthChart xs={SIZES} series={seriesFor(data.time, cx.timeClass)} yLabel="steps" />
        </div>
        <div className="card panel">
          <div className="panel-title">Peak extra memory vs. input size</div>
          <GrowthChart xs={SIZES} series={seriesFor(data.space, cx.spaceClass)} yLabel="items" />
        </div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>↻ Re-measure with new random inputs</button>
        <span className="faint" style={{ fontSize: 13 }}>Each point averages {RUNS} random inputs, traced by the same code as the animation.</span>
      </div>

      <div className="card panel">
        <div className="panel-title">Where the time goes (example input)</div>
        <p className="heat-note">Darker lines ran more often. The hottest lines sit inside the loops, and their counts are what the Big-O describes.</p>
        <CodeView code={anim.code} heat={heat} />
      </div>
    </div>
  )
}
