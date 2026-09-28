import { labeledCode, Tracer, randInt } from '../engine/tracer'
import type { Animation, GraphNode, Panel, Tone } from '../engine/types'

interface Input {
  numCourses: number
  prerequisites: [number, number][]
}

const { code, L } = labeledCode(`
from collections import deque

class Solution:
    def canFinish(self, numCourses, prerequisites):
        graph = [[] for _ in range(numCourses)]             #@graph
        indegree = [0] * numCourses                         #@indeg
        for course, pre in prerequisites:                   #@forEdge
            graph[pre].append(course)                       #@append
            indegree[course] += 1                           #@inc
        queue = deque(i for i in range(numCourses) if indegree[i] == 0)  #@queue
        taken = 0                                           #@taken
        while queue:                                        #@while
            node = queue.popleft()                          #@pop
            taken += 1                                      #@count
            for nxt in graph[node]:                         #@forNbr
                indegree[nxt] -= 1                          #@dec
                if indegree[nxt] == 0:                      #@if
                    queue.append(nxt)                       #@push
        return taken == numCourses                          #@ret
`)

/** Layered layout: level = longest prerequisite chain; cycle members go last. */
function layout(n: number, edges: [number, number][]): GraphNode[] {
  const out: number[][] = Array.from({ length: n }, () => [])
  const indeg = new Array(n).fill(0)
  for (const [c, p] of edges) { out[p].push(c); indeg[c]++ }
  const level = new Array(n).fill(-1)
  const q: number[] = []
  indeg.forEach((d, i) => { if (d === 0) { q.push(i); level[i] = 0 } })
  const deg = [...indeg]
  while (q.length) {
    const u = q.shift()!
    for (const v of out[u]) {
      level[v] = Math.max(level[v], level[u] + 1)
      if (--deg[v] === 0) q.push(v)
    }
  }
  const maxLevel = Math.max(0, ...level)
  for (let i = 0; i < n; i++) if (deg[i] > 0) level[i] = maxLevel + 1
  const cols = Math.max(...level) + 1
  const byLevel: number[][] = Array.from({ length: cols }, () => [])
  level.forEach((l, i) => byLevel[l].push(i))
  const nodes: GraphNode[] = []
  byLevel.forEach((ids, l) => ids.forEach((id, k) => nodes.push({
    id: String(id),
    x: cols === 1 ? 0.5 : l / (cols - 1),
    y: (k + 1) / (ids.length + 1),
  })))
  return nodes.sort((a, b) => +a.id - +b.id)
}

function trace({ numCourses: n, prerequisites }: Input) {
  const t = new Tracer()
  const baseNodes = layout(n, prerequisites)
  const edges = prerequisites.map(([c, p]) => [String(p), String(c)] as [string, string])

  let graph: number[][] | null = null
  let indegree: number[] | null = null
  let queue: number[] | null = null
  let taken: number | null = null
  let node: number | null = null
  const done = new Set<number>()

  const snap = (hl: {
    edge?: [number, number]; nodeTone?: Record<number, Tone>; idx?: number; idxTone?: Tone; qHi?: number
  } = {}): Panel[] => {
    const nodeTones: Record<string, Tone> = {}
    queue?.forEach((q) => { nodeTones[q] = 'visited' })
    done.forEach((d) => { nodeTones[d] = 'done' })
    if (node !== null) nodeTones[node] = 'active'
    Object.entries(hl.nodeTone ?? {}).forEach(([k, v]) => { nodeTones[k] = v })
    const edgeTones: Record<string, Tone> = {}
    if (hl.edge) edgeTones[`${hl.edge[0]}->${hl.edge[1]}`] = 'active'
    const panels: Panel[] = [{
      kind: 'graph', title: 'Prerequisite graph (pre → course)', directed: true,
      nodes: baseNodes.map((nd) => ({ ...nd, badge: indegree ? indegree[+nd.id] : undefined })),
      edges, nodeTones, edgeTones,
    }]
    if (indegree) {
      const tones: Record<number, Tone> = {}
      indegree.forEach((d, i) => { if (d === 0) tones[i] = 'done' })
      if (hl.idx !== undefined) tones[hl.idx] = hl.idxTone ?? 'active'
      panels.push({ kind: 'array', title: 'indegree', aux: true, values: [...indegree], tones })
    }
    if (queue) panels.push({ kind: 'list', style: 'queue', title: 'queue', aux: true, items: [...queue], highlight: hl.qHi })
    if (graph) panels.push({
      kind: 'map', title: 'graph (adjacency list)', aux: true,
      entries: graph.map((nb, i) => [i, `[${nb.join(', ')}]`]),
      highlightKey: node ?? hl.edge?.[0],
    })
    panels.push({ kind: 'vars', title: 'variables', vars: { taken, node, numCourses: n } })
    return panels
  }

  graph = Array.from({ length: n }, () => [])
  t.step(L.graph, `Create an empty adjacency list for ${n} courses.`, snap())
  indegree = new Array(n).fill(0)
  t.step(L.indeg, 'indegree[i] = how many prerequisites course i still waits on.', snap())
  for (const [course, pre] of prerequisites) {
    t.step(L.forEdge, `Read prerequisite [${course}, ${pre}]: take ${pre} before ${course}.`, snap({ edge: [pre, course] }))
    graph[pre].push(course)
    t.step(L.append, `Add edge ${pre} → ${course}.`, snap({ edge: [pre, course] }))
    indegree[course]++
    t.step(L.inc, `Course ${course} now waits on ${indegree[course]} prerequisite(s).`, snap({ edge: [pre, course], idx: course }))
  }
  t.step(L.forEdge, 'All prerequisites read — loop ends.', snap())
  queue = []
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i)
  t.step(L.queue, queue.length
    ? `Courses with no prerequisites can start now: ${queue.join(', ')}.`
    : 'No course has indegree 0 — nothing can start, so there must be a cycle.', snap())
  taken = 0
  t.step(L.taken, 'Count how many courses we manage to take.', snap())

  while (true) {
    if (!queue.length) {
      t.step(L.while, 'Queue is empty — no more courses are unlocked.', snap())
      break
    }
    t.step(L.while, `Queue has ${queue.length} course(s) ready.`, snap({ qHi: 0 }))
    node = queue.shift()!
    t.step(L.pop, `Take course ${node} off the front of the queue.`, snap())
    taken++
    done.add(node)
    t.step(L.count, `Course ${node} is finished. taken = ${taken}.`, snap())
    for (const nxt of graph[node]) {
      t.step(L.forNbr, `Course ${nxt} depends on ${node}.`, snap({ edge: [node, nxt], nodeTone: { [nxt]: 'warn' } }))
      indegree[nxt]--
      t.step(L.dec, `One prerequisite of ${nxt} is done → indegree ${indegree[nxt]}.`, snap({ edge: [node, nxt], idx: nxt, idxTone: 'warn', nodeTone: { [nxt]: 'warn' } }))
      const ready = indegree[nxt] === 0
      t.step(L.if, ready ? `indegree[${nxt}] is 0 — it's unlocked!` : `${nxt} still has prerequisites left — skip.`,
        snap({ idx: nxt, idxTone: ready ? 'match' : 'warn', nodeTone: { [nxt]: ready ? 'match' : 'warn' } }))
      if (ready) {
        queue.push(nxt)
        t.step(L.push, `Enqueue course ${nxt}.`, snap({ qHi: queue.length - 1 }))
      }
    }
    t.step(L.forNbr, `No more courses depend on ${node}.`, snap())
    node = null
  }
  const ok = taken === n
  t.step(L.ret, ok
    ? `taken (${taken}) == numCourses (${n}) → true. Every course can be finished.`
    : `taken (${taken}) < numCourses (${n}) → false. The untaken courses form a cycle.`,
    snap(ok ? {} : { nodeTone: Object.fromEntries([...Array(n).keys()].filter((i) => !done.has(i)).map((i) => [i, 'warn'])) }), ok)
  return t.steps
}

export const courseSchedule: Animation<Input> = {
  code,
  defaultInput: { numCourses: 6, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [5, 4]] },
  trace,
  pyArgs: ({ numCourses, prerequisites }) => [numCourses, prerequisites],
  generate: (size) => {
    const n = Math.max(2, Math.floor(size / 2))
    const prerequisites: [number, number][] = []
    for (let k = 0; k < size - n; k++) {
      const a = randInt(0, n - 2)
      prerequisites.push([randInt(a + 1, n - 1), a])
    }
    return { numCourses: n, prerequisites }
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    timeClass: 'n',
    spaceClass: 'n',
    sizeLabel: 'V + E (courses + prerequisites)',
    why: [
      'Building the graph reads each prerequisite once: O(E).',
      'Each course enters and leaves the queue at most once: O(V).',
      'Each edge is relaxed exactly once, when its source course is popped: O(E).',
      'The adjacency list stores E edges; indegree and queue hold at most V items.',
    ],
  },
}
