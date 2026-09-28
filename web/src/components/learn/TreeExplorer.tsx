import { useMemo, useState } from 'react'
import { buildTree, height, nodes, treePanel, type TNode, type TreeArray } from '../../engine/tree'
import type { Tone } from '../../engine/types'
import { PanelView } from '../PanelView'

const SHAPES: { label: string; tree: TreeArray; note: string }[] = [
  { label: 'Example', tree: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], note: 'A typical binary tree (also a BST).' },
  { label: 'Perfect', tree: [1, 2, 3, 4, 5, 6, 7], note: 'Every level is completely full: 2^(h+1) − 1 nodes.' },
  { label: 'Complete', tree: [1, 2, 3, 4, 5, 6], note: 'Full on every level except the last, which is pushed left. This is how heaps are stored.' },
  { label: 'Full', tree: [1, 2, 3, null, null, 4, 5], note: 'Every node has 0 or 2 children, never exactly 1.' },
  { label: 'Skewed', tree: [1, null, 2, null, 3, null, 4], note: 'A "linked list" in disguise: height n − 1. This is the worst case for recursion depth.' },
]

function describe(root: TNode | null) {
  const all = nodes(root)
  const children = (n: TNode) => (n.left ? 1 : 0) + (n.right ? 1 : 0)
  const full = all.every((n) => children(n) !== 1)
  const leafDepths = new Set<number>()
  const walk = (n: TNode | null, d: number) => {
    if (!n) return
    if (!n.left && !n.right) leafDepths.add(d)
    walk(n.left, d + 1)
    walk(n.right, d + 1)
  }
  walk(root, 0)
  const perfect = full && leafDepths.size <= 1
  // complete: in level order, no real node appears after the first gap
  let gap = false
  let complete = true
  const q: (TNode | null)[] = [root]
  while (q.length) {
    const n = q.shift()!
    if (!n) { gap = true; continue }
    if (gap) { complete = false; break }
    q.push(n.left, n.right)
  }
  return { n: all.length, h: height(root), full, perfect, complete }
}

function info(root: TNode | null, target: TNode) {
  let depth = -1
  const find = (n: TNode | null, d: number) => {
    if (!n) return
    if (n === target) depth = d
    find(n.left, d + 1)
    find(n.right, d + 1)
  }
  find(root, 0)
  return { depth, height: height(target), size: nodes(target).length, leaf: !target.left && !target.right }
}

export function TreeExplorer() {
  const [shape, setShape] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const root = useMemo(() => buildTree(SHAPES[shape].tree), [shape])
  const facts = describe(root)
  const target = nodes(root).find((n) => n.id === picked) ?? null
  const sel = target ? info(root, target) : null

  const tones: Record<string, Tone> = {}
  if (target) {
    nodes(target).forEach((n) => { tones[n.id] = 'visited' })
    tones[target.id] = 'active'
  }
  const panel = treePanel(root, 'click a node', { tones })

  return (
    <div className="explorer">
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {SHAPES.map((s, i) => (
          <button key={s.label} className={`pill${i === shape ? ' on' : ''}`} onClick={() => { setShape(i); setPicked(null) }}>{s.label}</button>
        ))}
      </div>
      <p className="muted" style={{ margin: '0 0 10px', fontSize: 14 }}>{SHAPES[shape].note}</p>
      <div className="explorer-grid">
        <div
          onClick={(e) => {
            const g = (e.target as Element).closest('g.node')
            const label = g?.querySelector('text')?.textContent
            const hit = nodes(root).find((n) => String(n.val) === label)
            setPicked(hit ? hit.id : null)
          }}
          style={{ cursor: 'pointer' }}
        >
          <PanelView panel={panel} />
        </div>
        <div className="card panel explorer-facts">
          <div className="panel-title">Whole tree</div>
          <dl>
            <dt>nodes n</dt><dd>{facts.n}</dd>
            <dt>edges</dt><dd>{Math.max(0, facts.n - 1)} <span className="faint">(always n − 1)</span></dd>
            <dt>height h</dt><dd>{facts.h} <span className="faint">(edges, root → deepest leaf)</span></dd>
            <dt>null pointers</dt><dd>{facts.n + 1} <span className="faint">(always n + 1, CS 225)</span></dd>
          </dl>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {(['full', 'perfect', 'complete'] as const).map((k) => (
              <span key={k} className={`chip ${facts[k] ? 'st-solved' : 'st-todo'}`}>{facts[k] ? '✓' : '✗'} {k}</span>
            ))}
          </div>
          <div className="panel-title" style={{ marginTop: 16 }}>{target ? `Node ${target.val}` : 'Selected node'}</div>
          {sel ? (
            <dl>
              <dt>depth</dt><dd>{sel.depth} <span className="faint">(edges up to the root)</span></dd>
              <dt>height</dt><dd>{sel.height} <span className="faint">(edges down to its deepest leaf)</span></dd>
              <dt>subtree size</dt><dd>{sel.size} <span className="faint">(blue: this node + descendants)</span></dd>
              <dt>kind</dt><dd>{sel.depth === 0 ? 'root' : sel.leaf ? 'leaf (no children)' : 'internal node'}</dd>
            </dl>
          ) : <p className="faint" style={{ fontSize: 13, margin: 0 }}>Click a node in the tree.</p>}
        </div>
      </div>
    </div>
  )
}
