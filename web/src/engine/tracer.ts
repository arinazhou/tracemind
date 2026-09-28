import type { Panel, Step } from './types'

/**
 * Parse solution source where lines are tagged with a trailing `#@label`.
 * Returns the clean code plus a lookup from label to 1-based line number,
 * so tracers say `L.pop` instead of hard-coding line numbers.
 */
export function labeledCode(src: string) {
  const lines = src.replace(/^\n/, '').replace(/\s+$/, '').split('\n')
  const L: Record<string, number> = {}
  const clean = lines.map((line, i) => {
    const m = line.match(/\s*#@(\w+)\s*$/)
    if (!m) return line
    if (m[1] in L) throw new Error(`duplicate code label: ${m[1]}`)
    L[m[1]] = i + 1
    return line.slice(0, m.index)
  })
  const lookup = new Proxy(L, {
    get(target, key: string) {
      if (!(key in target)) throw new Error(`unknown code label: ${key}`)
      return target[key]
    },
  })
  return { code: clean.join('\n'), L: lookup }
}

/** Collects steps; guards against runaway traces on huge inputs. */
export class Tracer {
  steps: Step[] = []
  constructor(private limit = 20000) {}

  step(line: number, note: string, panels: Panel[], result?: unknown) {
    if (this.steps.length >= this.limit) throw new TraceLimitError(this.limit)
    this.steps.push(result === undefined ? { line, note, panels } : { line, note, panels, result })
  }
}

export class TraceLimitError extends Error {
  constructor(limit: number) {
    super(`Trace exceeded ${limit} steps — try a smaller input.`)
  }
}

/** Auxiliary space of a step = total items held in panels flagged `aux`. */
export function auxSize(step: Step): number {
  let total = 0
  for (const p of step.panels) {
    if (!p.aux) continue
    switch (p.kind) {
      case 'array': total += p.values.length; break
      case 'list': total += p.items.length; break
      case 'map': total += p.entries.length; break
      case 'grid': total += p.cells.reduce((s, row) => s + row.length, 0); break
      case 'graph': total += p.nodes.length + p.edges.length; break
      case 'vars': total += Object.keys(p.vars).length; break
    }
  }
  return total
}

export function randInt(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}
