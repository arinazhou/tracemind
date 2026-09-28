// The four tree templates taught on the Learn → Trees page, each as a real
// LeetCode problem: bottom-up (104), top-down (98), BFS (102), global+return (543).
import { labeledCode, Tracer } from '../engine/tracer'
import { buildTree, pyTree, randomBST, randomTree, treePanel, type TNode, type TreeArray } from '../engine/tree'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { tree: TreeArray }

const fmt = (x: number) => (x === Infinity ? '∞' : x === -Infinity ? '-∞' : String(x))

// ------------------------------------------------------------ 104 bottom-up

const depthSrc = labeledCode(`
class Solution:
    def maxDepth(self, root):
        if not root:                                #@base
            return 0                                #@ret0
        left = self.maxDepth(root.left)             #@left
        right = self.maxDepth(root.right)           #@right
        return 1 + max(left, right)                 #@ret
`)

function traceDepth({ tree }: Input) {
  const { L } = depthSrc
  const t = new Tracer()
  const root = buildTree(tree)
  const stack: string[] = []
  const returned = new Map<string, number>()
  const onStack = new Set<string>()

  const snap = (cur?: TNode | null, tone: Tone = 'active', edge?: string): Panel[] => {
    const tones: Record<string, Tone> = {}
    returned.forEach((_, id) => { tones[id] = 'done' })
    onStack.forEach((id) => { tones[id] = 'visited' })
    if (cur) tones[cur.id] = tone
    return [
      treePanel(root, 'tree · badge = depth this subtree returned', { tones, badges: Object.fromEntries(returned), activeEdges: edge ? [edge] : [] }),
      { kind: 'list', style: 'stack', title: 'call stack (each frame waits for its children)', aux: true, items: [...stack], highlight: stack.length - 1 },
    ]
  }

  const go = (node: TNode | null, parent?: TNode): number => {
    stack.push(node ? `maxDepth(${node.val})` : 'maxDepth(None)')
    t.step(L.base, node ? `Ask subtree ${node.val}: how deep are you?` : `Empty subtree under ${parent?.val ?? 'the root'}.`, snap(node ?? parent, node ? 'active' : 'warn'))
    if (!node) {
      t.step(L.ret0, 'An empty tree has depth 0. This is the base case that stops the recursion.', snap(parent, 'warn'))
      stack.pop()
      return 0
    }
    onStack.add(node.id)
    t.step(L.left, `Ask ${node.val}'s left child first.`, snap(node, 'active', node.left?.id))
    const left = go(node.left, node)
    stack[stack.length - 1] = `maxDepth(${node.val})  left=${left}`
    t.step(L.left, `Left subtree of ${node.val} reports depth ${left}.`, snap(node))
    t.step(L.right, `Now ask the right child.`, snap(node, 'active', node.right?.id))
    const right = go(node.right, node)
    stack[stack.length - 1] = `maxDepth(${node.val})  left=${left} right=${right}`
    t.step(L.right, `Right subtree of ${node.val} reports depth ${right}.`, snap(node))
    const d = 1 + Math.max(left, right)
    onStack.delete(node.id)
    returned.set(node.id, d)
    t.step(L.ret, `Combine: 1 (this node) + max(${left}, ${right}) = ${d}. Hand it up to the parent.`, snap(node, 'match'))
    stack.pop()
    return d
  }

  const ans = go(root)
  t.steps[t.steps.length - 1].result = ans
  return t.steps
}

export const maxDepth: Animation<Input> = {
  code: depthSrc.code,
  defaultInput: { tree: [3, 9, 20, null, null, 15, 7] },
  examples: [{ label: 'empty', input: { tree: [] } }, { label: 'skewed', input: { tree: [1, null, 2, null, 3] } }],
  trace: traceDepth,
  pyArgs: ({ tree }) => [pyTree(tree)],
  generate: (n) => ({ tree: randomTree(n) }),
  complexity: {
    time: 'O(n)', space: 'O(h)', timeClass: 'n', spaceClass: 'n', sizeLabel: 'n (nodes)',
    why: [
      'Every node is asked exactly once and combines two answers in O(1).',
      'Answers flow bottom-up: a node can only answer after both children have returned.',
      'Stack depth = height of the tree: O(log n) balanced, O(n) skewed.',
    ],
  },
}

// ------------------------------------------------------------ 98 top-down

const bstSrc = labeledCode(`
class Solution:
    def isValidBST(self, root):
        def valid(node, low, high):                             #@def
            if not node:                                        #@base
                return True                                     #@retT
            if not (low < node.val < high):                     #@check
                return False                                    #@retF
            return (valid(node.left, low, node.val) and         #@left
                    valid(node.right, node.val, high))          #@right
        return valid(root, float('-inf'), float('inf'))         #@call
`)

function traceBST({ tree }: Input) {
  const { L } = bstSrc
  const t = new Tracer()
  const root = buildTree(tree)
  const stack: string[] = []
  const ok = new Set<string>()
  const bounds: Record<string, string> = {}
  let bad: string | null = null

  const snap = (cur?: TNode | null, tone: Tone = 'active', edge?: string): Panel[] => {
    const tones: Record<string, Tone> = {}
    ok.forEach((id) => { tones[id] = 'done' })
    if (bad) tones[bad] = 'warn'
    if (cur) tones[cur.id] = tone
    return [
      treePanel(root, 'tree · green = inside its allowed range', { tones, activeEdges: edge ? [edge] : [] }),
      { kind: 'list', style: 'stack', title: 'call stack: valid(node, low, high)', aux: true, items: [...stack], highlight: stack.length - 1 },
      { kind: 'map', title: 'range each node had to fit (low, high)', entries: Object.entries(bounds), highlightKey: cur ? String(cur.val) : undefined },
    ]
  }

  const go = (node: TNode | null, low: number, high: number, parent?: TNode): boolean => {
    stack.push(`valid(${node ? node.val : 'None'}, ${fmt(low)}, ${fmt(high)})`)
    t.step(L.base, node ? `Check ${node.val}. It must satisfy ${fmt(low)} < ${node.val} < ${fmt(high)}.` : 'Empty subtree: nothing can break the rule.', snap(node ?? parent, node ? 'active' : 'warn'))
    if (!node) {
      t.step(L.retT, 'Return True.', snap(parent))
      stack.pop()
      return true
    }
    bounds[String(node.val)] = `(${fmt(low)}, ${fmt(high)})`
    const inside = low < node.val && node.val < high
    t.step(L.check, inside
      ? `${fmt(low)} < ${node.val} < ${fmt(high)} ✓. The range was passed DOWN from its ancestors.`
      : `${node.val} is outside (${fmt(low)}, ${fmt(high)})! It may be fine next to its parent, but an ancestor forbids it.`,
    snap(node, inside ? 'match' : 'warn'))
    if (!inside) {
      bad = node.id
      t.step(L.retF, 'Return False. The whole tree is invalid.', snap(node, 'warn'))
      stack.pop()
      return false
    }
    ok.add(node.id)
    t.step(L.left, `Left child must be < ${node.val}: narrow high to ${node.val}.`, snap(node, 'active', node.left?.id))
    const l = go(node.left, low, node.val, node)
    if (!l) {
      t.step(L.left, `Left side failed. \`and\` short-circuits, so the right side is never checked.`, snap(node))
      stack.pop()
      return false
    }
    t.step(L.right, `Right child must be > ${node.val}: raise low to ${node.val}.`, snap(node, 'active', node.right?.id))
    const r = go(node.right, node.val, high, node)
    t.step(L.right, r ? `Both sides of ${node.val} are valid.` : `Right side of ${node.val} failed.`, snap(node))
    stack.pop()
    return r
  }

  t.step(L.def, 'Helper carries the allowed range (low, high) down the tree.', snap())
  t.step(L.call, 'Start at the root with no limits: (-∞, ∞).', snap(root))
  const ans = go(root, -Infinity, Infinity)
  t.step(L.call, ans ? 'Every node fit its range → valid BST.' : 'A node broke its range → not a BST.', snap(), ans)
  return t.steps
}

export const validateBST: Animation<Input> = {
  code: bstSrc.code,
  // the classic trap: 3 < 8 is fine locally, but 3 sits in 5's RIGHT subtree
  defaultInput: { tree: [5, 4, 8, null, null, 3, 9] },
  examples: [
    { label: 'valid BST', input: { tree: [8, 4, 12, 2, 6, 10, 14] } },
    { label: 'LeetCode 2', input: { tree: [5, 1, 4, null, null, 3, 6] } },
    { label: 'empty', input: { tree: [] } },
  ],
  trace: traceBST,
  pyArgs: ({ tree }) => [pyTree(tree)],
  generate: (n) => ({ tree: Math.random() < 0.7 ? randomBST(n) : randomTree(n) }),
  complexity: {
    time: 'O(n)', space: 'O(h)', timeClass: 'n', spaceClass: 'n', sizeLabel: 'n (nodes)',
    why: [
      'Each node is checked once against its (low, high) range in O(1).',
      'The range is information from ANCESTORS, so it has to be passed down as parameters.',
      'Comparing a node only with its parent is not enough: 3 < 8, but 3 is inside 5\'s right subtree.',
      'The stack holds one frame per level: O(h).',
    ],
  },
}

// ------------------------------------------------------------ 102 BFS

const bfsSrc = labeledCode(`
from collections import deque

class Solution:
    def levelOrder(self, root):
        if not root:                                    #@empty
            return []                                   #@ret0
        result = []                                     #@res
        queue = deque([root])                           #@q
        while queue:                                    #@while
            level = []                                  #@level
            for _ in range(len(queue)):                 #@for
                node = queue.popleft()                  #@pop
                level.append(node.val)                  #@append
                if node.left:                           #@ifL
                    queue.append(node.left)             #@pushL
                if node.right:                          #@ifR
                    queue.append(node.right)            #@pushR
            result.append(level)                        #@add
        return result                                   #@ret
`)

function traceBFS({ tree }: Input) {
  const { L } = bfsSrc
  const t = new Tracer()
  const root = buildTree(tree)
  const result: number[][] = []
  let queue: TNode[] = []
  let level: number[] | null = null
  const done = new Set<string>()
  const levelOf = new Map<string, number>()

  const snap = (cur?: TNode | null, tone: Tone = 'active'): Panel[] => {
    const tones: Record<string, Tone> = {}
    done.forEach((id) => { tones[id] = 'done' })
    queue.forEach((n) => { tones[n.id] = 'visited' })
    if (cur) tones[cur.id] = tone
    return [
      treePanel(root, 'tree · badge = level', { tones, badges: Object.fromEntries(levelOf) }),
      { kind: 'list', style: 'queue', title: 'queue', aux: true, items: queue.map((n) => n.val) },
      { kind: 'array', title: 'level (being built)', values: level ?? [] },
      { kind: 'map', title: 'result', entries: result.map((lv, k) => [`level ${k}`, `[${lv.join(', ')}]`]) },
    ]
  }

  if (!root) {
    t.step(L.empty, 'Empty tree.', snap())
    t.step(L.ret0, 'Return [].', snap(), [])
    return t.steps
  }
  t.step(L.empty, 'Tree is not empty.', snap())
  t.step(L.res, 'result will hold one list per level.', snap())
  queue = [root]
  levelOf.set(root.id, 0)
  t.step(L.q, 'Seed the queue with the root.', snap())
  let depth = 0
  while (true) {
    if (!queue.length) { t.step(L.while, 'Queue empty: every level is done.', snap()); break }
    t.step(L.while, `Queue holds exactly level ${depth}: ${queue.map((n) => n.val).join(', ')}.`, snap())
    level = []
    t.step(L.level, `Start collecting level ${depth}.`, snap())
    const size = queue.length
    for (let k = 0; k < size; k++) {
      t.step(L.for, `Snapshot len(queue) = ${size} BEFORE adding children, so this loop stops at the level boundary (${k + 1}/${size}).`, snap(queue[0]))
      const node = queue.shift()!
      t.step(L.pop, `Pop ${node.val}.`, snap(node))
      level.push(node.val)
      t.step(L.append, `level = [${level.join(', ')}].`, snap(node, 'match'))
      done.add(node.id)
      for (const [side, lf, lp] of [['left', L.ifL, L.pushL], ['right', L.ifR, L.pushR]] as const) {
        const child = node[side]
        t.step(lf, child ? `${node.val} has a ${side} child ${child.val}.` : `${node.val} has no ${side} child.`, snap(node))
        if (child) {
          queue.push(child)
          levelOf.set(child.id, depth + 1)
          t.step(lp, `Enqueue ${child.val} for level ${depth + 1}.`, snap(node))
        }
      }
    }
    t.step(L.for, `Processed all ${size} node(s) of level ${depth}.`, snap())
    result.push(level)
    t.step(L.add, `result gets [${level.join(', ')}].`, snap())
    level = null
    depth++
  }
  t.step(L.ret, `Return ${JSON.stringify(result)}.`, snap(), result.map((l) => [...l]))
  return t.steps
}

export const levelOrder: Animation<Input> = {
  code: bfsSrc.code,
  defaultInput: { tree: [3, 9, 20, null, null, 15, 7] },
  examples: [{ label: 'empty', input: { tree: [] } }, { label: 'full', input: { tree: [1, 2, 3, 4, 5, 6, 7] } }],
  trace: traceBFS,
  pyArgs: ({ tree }) => [pyTree(tree)],
  generate: (n) => ({ tree: randomTree(n) }),
  complexity: {
    time: 'O(n)', space: 'O(w)', timeClass: 'n', spaceClass: 'n', sizeLabel: 'n (nodes)',
    why: [
      'Each node is enqueued once and dequeued once.',
      'The queue holds at most one level plus part of the next: O(w), where w is the widest level.',
      'A perfect tree\'s last level has about n/2 nodes, so the worst case is O(n). For a skewed tree w = 1.',
      'DFS uses O(h) space and BFS O(w). A tall, thin tree favors BFS; a short, wide one favors DFS.',
    ],
  },
}

// ------------------------------------------------------------ 543 global + return

const diaSrc = labeledCode(`
class Solution:
    def diameterOfBinaryTree(self, root):
        best = 0                                        #@best
        def height(node):                               #@def
            nonlocal best
            if not node:                                #@base
                return 0                                #@ret0
            left = height(node.left)                    #@left
            right = height(node.right)                  #@right
            best = max(best, left + right)              #@upd
            return 1 + max(left, right)                 #@ret
        height(root)                                    #@call
        return best                                     #@retBest
`)

function traceDiameter({ tree }: Input) {
  const { L } = diaSrc
  const t = new Tracer()
  const root = buildTree(tree)
  const stack: string[] = []
  const heights = new Map<string, number>()
  const onStack = new Set<string>()
  let best = 0
  let bestAt: string | null = null

  const snap = (cur?: TNode | null, tone: Tone = 'active', edge?: string): Panel[] => {
    const tones: Record<string, Tone> = {}
    heights.forEach((_, id) => { tones[id] = 'done' })
    onStack.forEach((id) => { tones[id] = 'visited' })
    if (bestAt) tones[bestAt] = 'match'
    if (cur) tones[cur.id] = tone
    return [
      treePanel(root, 'tree · badge = height returned · yellow = where best path bends', { tones, badges: Object.fromEntries(heights), activeEdges: edge ? [edge] : [] }),
      { kind: 'list', style: 'stack', title: 'call stack', aux: true, items: [...stack], highlight: stack.length - 1 },
      { kind: 'vars', title: 'answer so far (outside the recursion)', vars: { best } },
    ]
  }

  const go = (node: TNode | null, parent?: TNode): number => {
    stack.push(node ? `height(${node.val})` : 'height(None)')
    t.step(L.base, node ? `height(${node.val}).` : 'Empty subtree.', snap(node ?? parent, node ? 'active' : 'warn'))
    if (!node) {
      t.step(L.ret0, 'Height 0 (counting nodes).', snap(parent, 'warn'))
      stack.pop()
      return 0
    }
    onStack.add(node.id)
    t.step(L.left, `Recurse left from ${node.val}.`, snap(node, 'active', node.left?.id))
    const l = go(node.left, node)
    t.step(L.left, `Left arm of ${node.val} is ${l} long.`, snap(node))
    t.step(L.right, `Recurse right from ${node.val}.`, snap(node, 'active', node.right?.id))
    const r = go(node.right, node)
    t.step(L.right, `Right arm of ${node.val} is ${r} long.`, snap(node))
    const through = l + r
    if (through > best) { best = through; bestAt = node.id }
    t.step(L.upd, `A path can BEND at ${node.val}: left arm + right arm = ${l} + ${r} = ${through} edges. best = ${best}.`, snap(node, through === best ? 'match' : 'active'))
    const h = 1 + Math.max(l, r)
    onStack.delete(node.id)
    heights.set(node.id, h)
    t.step(L.ret, `But the parent can only extend ONE arm, so return 1 + max(${l}, ${r}) = ${h}.`, snap(node))
    stack.pop()
    return h
  }

  t.step(L.best, 'best lives outside the recursion. Any node may be the bend point.', snap())
  t.step(L.def, 'height() returns ONE value upward and updates best on the side.', snap())
  t.step(L.call, 'Run it from the root. We ignore its return value.', snap(root))
  go(root)
  t.step(L.call, 'Recursion finished.', snap())
  t.step(L.retBest, `Diameter = ${best} edges.`, snap(), best)
  return t.steps
}

export const diameter: Animation<Input> = {
  code: diaSrc.code,
  defaultInput: { tree: [1, 2, 3, 4, 5, null, null, 6, null, null, 7] },
  examples: [{ label: 'LeetCode 1', input: { tree: [1, 2, 3, 4, 5] } }, { label: 'single node', input: { tree: [1] } }],
  trace: traceDiameter,
  pyArgs: ({ tree }) => [pyTree(tree)],
  generate: (n) => ({ tree: randomTree(Math.max(1, n)) }),
  complexity: {
    time: 'O(n)', space: 'O(h)', timeClass: 'n', spaceClass: 'n', sizeLabel: 'n (nodes)',
    why: [
      'One post-order pass: each node computes its height from its children in O(1).',
      'The answer (a path that bends) and the return value (one arm) are DIFFERENT things. That is why best lives outside.',
      'Recomputing heights at every node instead would be O(n²).',
      'Stack depth O(h).',
    ],
  },
}
