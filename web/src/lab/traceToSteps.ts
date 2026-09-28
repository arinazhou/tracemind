// Turns pytrace.py output into the same Step/Panel format the hand-written
// animations use, so any pasted solution plays in the standard player.
import { treePanel, type TNode } from '../engine/tree'
import type { Panel, Step, Tone } from '../engine/types'

export type PyVal =
  | { t: 'prim'; r: string }
  | { t: 'ref'; id: number }
  | { t: 'list' | 'tuple' | 'set' | 'deque'; v: PyVal[] }
  | { t: 'grid'; v: string[][] }
  | { t: 'dict'; v: [PyVal, PyVal][]; cls?: string }

type Struct =
  | { kind: 'tree'; nodes: { id: number; v: string; l: number | null; r: number | null }[] }
  | { kind: 'linked'; vals: string[]; cycle: number | null }

interface Frame { fn: string; vars: Record<string, PyVal> }

export interface RawStep {
  line: number
  event: 'line' | 'call' | 'return' | 'exception'
  stack: Frame[]
  structs: Record<string, Struct>
  refs: Record<string, [number, number]> // node id -> [struct id, position]
  callee?: string
  ret?: PyVal
  error?: string
  /** Length of stdout after this step. */
  out?: number
}

export interface TraceResult {
  ok: boolean
  error?: string
  steps?: RawStep[]
  result?: PyVal
  resultStructs?: Record<string, Struct>
  resultRefs?: Record<string, [number, number]>
  stdout?: string
  truncated?: boolean
  call?: string
}

const POINTER = /^(i|j|k|l|r|p|q|lo|hi|mid|left|right|start|end|slow|fast|idx|index|ptr|cur|curr|head|tail|pos|low|high|a|b|x|y)$/i
const GRID_PAIRS: [string, string][] = [['r', 'c'], ['row', 'col'], ['i', 'j'], ['x', 'y'], ['cr', 'cc'], ['nr', 'nc']]

export function show(v: PyVal | undefined, depth = 0): string {
  if (!v) return '—'
  switch (v.t) {
    case 'prim': return v.r
    case 'ref': return '•'
    case 'grid': return `[${v.v.length}×${v.v[0]?.length ?? 0} grid]`
    case 'dict':
      if (v.cls) return depth > 0 ? `${v.cls}(…)` : `${v.cls}(${v.v.map(([k, x]) => `${show(k, 1)}=${show(x, 1)}`).join(', ')})`
      return depth > 0 ? `{…${v.v.length}}` : `{${v.v.map(([k, x]) => `${show(k, 1)}: ${show(x, 1)}`).join(', ')}}`
    case 'tuple': return `(${v.v.map((x) => show(x, depth + 1)).join(', ')})`
    case 'set': return `{${v.v.map((x) => show(x, depth + 1)).join(', ')}}`
    default: return depth > 1 ? `[…${v.v.length}]` : `[${v.v.map((x) => show(x, depth + 1)).join(', ')}]`
  }
}

/** The return value as text; linked lists and trees are spelled out instead of shown as a pointer. */
export function showResult(t: TraceResult): string {
  const v = t.result
  if (v?.t !== 'ref') return show(v)
  const [sid] = t.resultRefs?.[String(v.id)] ?? []
  const st = sid !== undefined ? t.resultStructs?.[String(sid)] : undefined
  if (st?.kind === 'linked') return st.vals.join(' → ') + (st.cycle !== null ? ` ↺ (cycle to index ${st.cycle})` : '')
  if (st?.kind === 'tree') {
    const byIdx = st.nodes
    const out: string[] = []
    const q: (number | null)[] = [0]
    while (q.length) {
      const i = q.shift()!
      if (i === null) { out.push('None'); continue }
      out.push(byIdx[i].v)
      q.push(byIdx[i].l, byIdx[i].r)
    }
    while (out[out.length - 1] === 'None') out.pop()
    return `tree([${out.join(', ')}])`
  }
  return '<node>'
}

/** "pal.append('bob')", "seen[2] = 0", "nums[3]: 1 → 4" instead of "changed". */
function describeChange(k: string, was: PyVal, now: PyVal): string {
  const listy = (x: PyVal): x is Extract<PyVal, { v: PyVal[] }> => x.t === 'list' || x.t === 'deque' || x.t === 'tuple' || x.t === 'set'
  if (listy(was) && listy(now)) {
    const a = was.v.map((x) => show(x, 1))
    const b = now.v.map((x) => show(x, 1))
    if (b.length === a.length + 1 && a.every((x, i) => x === b[i])) return `${k}.${now.t === 'set' ? 'add' : 'append'}(${b[b.length - 1]})`
    if (b.length === a.length + 1 && a.every((x, i) => x === b[i + 1])) return `${k}.appendleft(${b[0]})`
    if (b.length === a.length - 1 && b.every((x, i) => x === a[i])) return `${k}.pop() → ${a[a.length - 1]}`
    if (b.length === a.length - 1 && b.every((x, i) => x === a[i + 1])) return `${k}.popleft() → ${a[0]}`
    if (a.length === b.length && now.t !== 'set') {
      const diff = b.map((x, i) => (x !== a[i] ? i : -1)).filter((i) => i >= 0)
      if (diff.length <= 2) return diff.map((i) => `${k}[${i}]: ${a[i]} → ${b[i]}`).join(', ')
    }
  }
  if (was.t === 'dict' && now.t === 'dict') {
    const old = new Map(was.v.map(([x, y]) => [show(x, 1), show(y, 1)]))
    const changed = now.v.filter(([x, y]) => old.get(show(x, 1)) !== show(y, 1))
    const target = (key: string) => (now.cls ? `${k}.${key}` : `${k}[${key}]`)
    if (changed.length && changed.length <= 2) return changed.map(([x, y]) => `${target(show(x, 1))} = ${show(y, 1)}`).join(', ')
  }
  if (was.t === 'grid' && now.t === 'grid') {
    const cells: string[] = []
    now.v.forEach((row, r) => row.forEach((x, c) => { if (was.v[r]?.[c] !== x) cells.push(`${k}[${r}][${c}] = ${x}`) }))
    if (cells.length && cells.length <= 2) return cells.join(', ')
  }
  return `${k} changed`
}

const same = (a?: PyVal, b?: PyVal) => JSON.stringify(a) === JSON.stringify(b)
const asInt = (v?: PyVal) => (v?.t === 'prim' && /^-?\d+$/.test(v.r) ? Number(v.r) : null)

function frameLabel(f: Frame) {
  const args = Object.entries(f.vars).filter(([, v]) => v.t === 'prim' || v.t === 'ref').slice(0, 3)
  return `${f.fn}(${args.map(([k, v]) => `${k}=${show(v)}`).join(', ')})`
}

function treeRoot(s: Extract<Struct, { kind: 'tree' }>): TNode | null {
  const build = (i: number | null): TNode | null => {
    if (i === null) return null
    const n = s.nodes[i]
    return { id: String(n.id), val: n.v as unknown as number, left: build(n.l), right: build(n.r) }
  }
  return build(s.nodes.length ? 0 : null)
}

/** Convert a whole trace. Diffs are computed per call-stack depth. */
export function toSteps(trace: TraceResult, code = ''): Step[] {
  const raw = trace.steps ?? []
  const src = code.split('\n')
  const lastVars = new Map<string, Record<string, PyVal>>()
  return raw.map((s, i) => {
    const top = s.stack[s.stack.length - 1] ?? { fn: '', vars: {} }
    const key = `${s.stack.length}:${top.fn}`
    const prev = lastVars.get(key)
    lastVars.set(key, top.vars)
    // where this frame goes next tells us how a condition evaluated
    const next = raw.slice(i + 1).find((n) => n.stack.length === s.stack.length && n.event !== 'call')
    const out = (trace.stdout ?? '').slice(0, s.out ?? 0)
    const before = i > 0 ? (raw[i - 1].out ?? 0) : 0
    const printed = out.slice(before)
    const ps = panels(s, top, prev)
    if (trace.stdout) ps.push({ kind: 'text', title: 'output (print)', text: out, fresh: printed.length })
    let n = note(s, top, prev, src, next?.line)
    if (printed) n = `printed ${JSON.stringify(printed.replace(/\n$/, '')).slice(0, 80)}. ${n}`
    return { line: s.line, note: n, panels: ps }
  })
}

/** For a condition line, "True"/"False" from whether execution entered the indented block below it. */
function branch(src: string[], line: number, nextLine?: number): string | null {
  const text = src[line - 1] ?? ''
  const m = text.match(/^(\s*)(if|elif|while)\s+(.*):\s*(#.*)?$/)
  if (!m || nextLine === undefined) return null
  const indent = m[1].length
  let body = line + 1
  while (body <= src.length && !src[body - 1].trim()) body++
  const bodyIndent = (src[body - 1] ?? '').match(/^\s*/)![0].length
  const entered = bodyIndent > indent && nextLine === body
  return `\`${m[2]} ${m[3].trim()}\` is ${entered ? 'True' : 'False'}${m[2] === 'while' && !entered ? ', so the loop ends' : ''}`
}

function note(s: RawStep, top: Frame, prev: Record<string, PyVal> | undefined, src: string[] = [], nextLine?: number): string {
  if (s.event === 'exception') return `💥 ${s.error}`
  if (s.event === 'call') return `Call ${s.callee}(…). ${top.fn} pauses here until it returns.`
  const changes: string[] = []
  for (const [k, v] of Object.entries(top.vars)) {
    if (prev && same(prev[k], v)) continue
    if (!prev || !(k in prev)) changes.push(v.t === 'prim' || v.t === 'ref' ? `${k} = ${show(v)}` : `new ${k}`)
    else if (v.t === 'prim') changes.push(`${k}: ${show(prev[k])} → ${v.r}`)
    else if (v.t === 'ref') changes.push(`${k} moved`)
    else changes.push(describeChange(k, prev[k], v))
  }
  const head = s.event === 'return' && top.fn !== 'main' ? `${top.fn} returns ${show(s.ret)}` : ''
  const body = changes.slice(0, 5).join(' · ') + (changes.length > 5 ? ' …' : '')
  const cond = s.event === 'line' ? branch(src, s.line, nextLine) : null
  const text = (src[s.line - 1] ?? '').trim().replace(/\s+#.*$/, '')
  return [head, cond, body].filter(Boolean).join('. ') || (text ? `Ran \`${text}\`` : `Line ${s.line}`)
}

function panels(s: RawStep, top: Frame, prev?: Record<string, PyVal>): Panel[] {
  const out: Panel[] = []
  const small: Panel[] = []
  const prims: Record<string, string> = {}
  const ints: Record<string, number> = {}
  for (const [k, v] of Object.entries(top.vars)) {
    if (v.t === 'prim') {
      prims[k] = v.r
      const n = asInt(v)
      if (n !== null && POINTER.test(k)) ints[k] = n
    }
  }

  // linked structures: pointer names from every frame; top frame = active, lower frames = on stack
  const nodeRefs = new Map<string, { names: string[]; tone: Tone }>()
  s.stack.forEach((f, depth) => {
    const isTop = depth === s.stack.length - 1
    for (const [k, v] of Object.entries(f.vars)) {
      if (v.t !== 'ref') continue
      const e = nodeRefs.get(String(v.id)) ?? { names: [], tone: 'visited' as Tone }
      if (isTop) { e.names.push(k); e.tone = 'active' }
      nodeRefs.set(String(v.id), e)
    }
  })
  for (const [sid, st] of Object.entries(s.structs)) {
    if (st.kind === 'tree') {
      const tones: Record<string, Tone> = {}
      const labels: string[] = []
      for (const n of st.nodes) {
        const r = nodeRefs.get(String(n.id))
        if (r) {
          tones[String(n.id)] = r.tone
          if (r.names.length) labels.push(`${r.names.join('/')} → ${n.v}`)
        }
      }
      out.push(treePanel(treeRoot(st), `tree${labels.length ? ` · ${labels.join(', ')}` : ''}`, { tones }))
    } else {
      const pointers: Record<string, number> = {}
      const tones: Record<number, Tone> = {}
      for (const [nid, [owner, pos]] of Object.entries(s.refs)) {
        if (String(owner) !== sid) continue
        const r = nodeRefs.get(nid)
        if (!r) continue
        tones[pos] = r.tone
        if (r.names.length) pointers[r.names.join('/')] = pos
      }
      const title = `linked list${st.cycle !== null ? ` · tail points back to index ${st.cycle} (cycle)` : ''}`
      out.push({ kind: 'array', title, values: st.vals, pointers, tones, arrows: true })
    }
  }

  for (const [k, v] of Object.entries(top.vars)) {
    const was = prev?.[k]
    if (v.t === 'grid') {
      const tones: Record<string, Tone> = {}
      const old = was?.t === 'grid' ? was.v : null
      v.v.forEach((row, r) => row.forEach((x, c) => { if (old && old[r]?.[c] !== x) tones[`${r},${c}`] = 'match' }))
      let cursor: [number, number] | undefined
      for (const [a, b] of GRID_PAIRS) {
        const ra = asInt(top.vars[a]); const cb = asInt(top.vars[b])
        if (ra !== null && cb !== null && ra >= 0 && cb >= 0 && ra < v.v.length && cb < (v.v[0]?.length ?? 0)) { cursor = [ra, cb]; tones[`${ra},${cb}`] = 'active'; break }
      }
      out.push({ kind: 'grid', title: k, cells: v.v, tones, cursor })
    } else if (v.t === 'list' || v.t === 'tuple') {
      const values = v.v.map((x) => show(x, 1))
      if (/stack|^st$/i.test(k)) {
        small.push({ kind: 'list', style: 'stack', title: k, items: values, highlight: values.length - 1 })
        continue
      }
      const tones: Record<number, Tone> = {}
      if (was && (was.t === 'list' || was.t === 'tuple')) values.forEach((x, i) => { if (show(was.v[i], 1) !== x) tones[i] = 'match' })
      const pointers: Record<string, number> = {}
      if (values.length >= 2) for (const [name, n] of Object.entries(ints)) if (n >= 0 && n < values.length) { pointers[name] = n; tones[n] ??= 'active' }
      out.push({ kind: 'array', title: k, values, tones, pointers })
    } else if (v.t === 'deque') {
      small.push({ kind: 'list', style: 'queue', title: `${k} (deque)`, items: v.v.map((x) => show(x, 1)) })
    } else if (v.t === 'set') {
      small.push({ kind: 'list', style: 'queue', title: `${k} (set)`, items: v.v.map((x) => show(x, 1)) })
    } else if (v.t === 'dict') {
      const oldKeys = new Map(was?.t === 'dict' ? was.v.map(([a, b]) => [show(a), show(b)]) : [])
      const changed = v.v.find(([a, b]) => oldKeys.get(show(a)) !== show(b))
      const key = (a: PyVal) => (v.cls ? `.${show(a)}` : show(a))
      small.push({ kind: 'map', title: v.cls ? `${k}: ${v.cls} object` : k, entries: v.v.map(([a, b]) => [key(a), show(b, 1)]), highlightKey: changed ? key(changed[0]) : undefined })
    }
  }

  const vars: Record<string, string> = { ...prims }
  if (s.event === 'return' && top.fn !== 'main') vars['↩ return'] = show(s.ret)
  if (Object.keys(vars).length) small.push({ kind: 'vars', title: `variables in ${top.fn || 'call'}()`, vars })
  if (s.stack.length > 1) {
    small.push({ kind: 'list', style: 'stack', title: 'call stack', aux: true, items: s.stack.map(frameLabel), highlight: s.stack.length - 1 })
  }
  return [...out, ...small]
}
