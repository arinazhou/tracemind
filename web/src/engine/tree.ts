// Binary-tree helpers shared by tree tracers and the lesson page.
// Trees use LeetCode's level-order array format: [3, 9, 20, null, null, 15, 7].
import { randInt } from './tracer'
import type { GraphPanel, Tone } from './types'

export type TreeArray = (number | null)[]

export interface TNode {
  id: string
  val: number
  left: TNode | null
  right: TNode | null
}

/** Build a tree from LeetCode's level-order array. Node ids are array indices. */
export function buildTree(arr: TreeArray): TNode | null {
  if (!arr.length || arr[0] === null) return null
  const root: TNode = { id: '0', val: arr[0], left: null, right: null }
  const queue = [root]
  let i = 1
  while (queue.length && i < arr.length) {
    const node = queue.shift()!
    for (const side of ['left', 'right'] as const) {
      if (i < arr.length && arr[i] !== null) {
        const child: TNode = { id: String(i), val: arr[i] as number, left: null, right: null }
        node[side] = child
        queue.push(child)
      }
      i++
    }
  }
  return root
}

/** Serialize back to a LeetCode array (trailing nulls trimmed). */
export function toArray(root: TNode | null): TreeArray {
  const out: TreeArray = []
  const queue: (TNode | null)[] = [root]
  while (queue.length) {
    const node = queue.shift()!
    out.push(node ? node.val : null)
    if (node) queue.push(node.left, node.right)
  }
  while (out.length && out[out.length - 1] === null) out.pop()
  return out
}

export function nodes(root: TNode | null): TNode[] {
  if (!root) return []
  return [root, ...nodes(root.left), ...nodes(root.right)]
}

/** CS 225 height: edges on the longest root→leaf path; empty tree = −1. */
export function height(root: TNode | null): number {
  return root ? 1 + Math.max(height(root.left), height(root.right)) : -1
}

export interface TreeStyle {
  tones?: Record<string, Tone>
  badges?: Record<string, string | number>
  /** Child ids whose incoming edge should be highlighted. */
  activeEdges?: string[]
}

/** Draw a tree with the generic graph panel: x = in-order rank, y = depth. */
export function treePanel(root: TNode | null, title: string, style: TreeStyle = {}): GraphPanel {
  const pos = new Map<string, { x: number; y: number }>()
  let rank = 0
  let maxDepth = 0
  const walk = (n: TNode | null, d: number) => {
    if (!n) return
    walk(n.left, d + 1)
    pos.set(n.id, { x: rank++, y: d })
    maxDepth = Math.max(maxDepth, d)
    walk(n.right, d + 1)
  }
  walk(root, 0)
  const edges: [string, string][] = []
  const edgeTones: Record<string, Tone> = {}
  for (const n of nodes(root)) {
    for (const c of [n.left, n.right]) {
      if (!c) continue
      edges.push([n.id, c.id])
      if (style.activeEdges?.includes(c.id)) edgeTones[`${n.id}->${c.id}`] = 'active'
    }
  }
  const span = Math.max(1, rank - 1)
  return {
    kind: 'graph',
    title,
    edges,
    edgeTones,
    nodeTones: style.tones,
    nodes: nodes(root).map((n) => ({
      id: n.id,
      label: String(n.val),
      x: rank === 1 ? 0.5 : pos.get(n.id)!.x / span,
      y: maxDepth === 0 ? 0.35 : 0.08 + (pos.get(n.id)!.y / maxDepth) * 0.84,
      badge: style.badges?.[n.id],
    })),
  }
}

/** Random tree with n nodes. shape: random / balanced (complete) / skewed (a path). */
export function randomTree(n: number, shape: 'random' | 'balanced' | 'skewed' = 'random', vals?: number[]): TreeArray {
  if (n <= 0) return []
  const values = vals ?? Array.from({ length: n }, () => randInt(1, 99))
  if (shape === 'balanced') return values.slice(0, n)
  const root: TNode = { id: '0', val: values[0], left: null, right: null }
  const all = [root]
  for (let k = 1; k < n; k++) {
    const child: TNode = { id: String(k), val: values[k], left: null, right: null }
    if (shape === 'skewed') {
      all[k - 1][Math.random() < 0.5 ? 'left' : 'right'] = child
    } else {
      // attach to a random node that still has a free slot
      while (true) {
        const parent = all[randInt(0, all.length - 1)]
        const side = Math.random() < 0.5 ? 'left' : 'right'
        if (!parent[side]) { parent[side] = child; break }
      }
    }
    all.push(child)
  }
  return toArray(root)
}

/** Random valid BST with n distinct values (insertion of a shuffled range). */
export function randomBST(n: number): TreeArray {
  const vals = Array.from({ length: n }, (_, k) => (k + 1) * 3)
  for (let k = vals.length - 1; k > 0; k--) {
    const j = randInt(0, k)
    ;[vals[k], vals[j]] = [vals[j], vals[k]]
  }
  let root: TNode | null = null
  vals.forEach((v, k) => {
    const node: TNode = { id: String(k), val: v, left: null, right: null }
    if (!root) { root = node; return }
    let cur: TNode = root
    while (true) {
      const side = v < cur.val ? 'left' : 'right'
      if (!cur[side]) { cur[side] = node; break }
      cur = cur[side]!
    }
  })
  return toArray(root)
}

/** Python argument marker understood by scripts/run_solution.py. */
export const pyTree = (arr: TreeArray) => ({ __tree__: arr })
