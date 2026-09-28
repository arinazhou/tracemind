import { labeledCode, Tracer } from '../engine/tracer'
import { buildTree, nodes, pyTree, randomTree, treePanel, type TNode, type TreeArray } from '../engine/tree'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { tree: TreeArray }
type Order = 'pre' | 'in' | 'post'

const METHOD = { pre: 'preorderTraversal', in: 'inorderTraversal', post: 'postorderTraversal' }
const WHEN = { pre: 'before both children', in: 'between the children', post: 'after both children' }

// The only difference between the three is WHERE the "visit" line sits.
function source(order: Order) {
  const visit = '            result.append(node.val)                 #@visit'
  const left = '            dfs(node.left)                          #@left'
  const right = '            dfs(node.right)                         #@right'
  const body = order === 'pre' ? [visit, left, right] : order === 'in' ? [left, visit, right] : [left, right, visit]
  return `
class Solution:
    def ${METHOD[order]}(self, root):
        result = []                                 #@res
        def dfs(node):                              #@def
            if not node:                            #@base
                return                              #@ret0
${body.join('\n')}
        dfs(root)                                   #@call
        return result                               #@ret
`
}

function makeTracer(order: Order) {
  const { code, L } = labeledCode(source(order))

  function trace({ tree }: Input) {
    const t = new Tracer()
    const root = buildTree(tree)
    const result: number[] = []
    const stack: string[] = [] // frames shown to the learner
    const onStack = new Set<string>()
    const finished = new Set<string>()
    const visitedAt = new Map<string, number>()

    const snap = (cur?: TNode | null, extra: { edge?: string; tone?: Tone } = {}): Panel[] => {
      const tones: Record<string, Tone> = {}
      finished.forEach((id) => { tones[id] = 'done' })
      onStack.forEach((id) => { tones[id] = 'visited' })
      if (cur) tones[cur.id] = extra.tone ?? 'active'
      const badges: Record<string, number> = {}
      visitedAt.forEach((k, id) => { badges[id] = k })
      return [
        treePanel(root, `tree · badge = visit order (${order}-order)`, { tones, badges, activeEdges: extra.edge ? [extra.edge] : [] }),
        { kind: 'list', style: 'stack', title: 'call stack', aux: true, items: [...stack], highlight: stack.length - 1 },
        { kind: 'array', title: 'result', aux: true, values: [...result], tones: result.length ? { [result.length - 1]: 'match' } : {} },
      ]
    }

    const dfs = (node: TNode | null, from?: TNode) => {
      stack.push(node ? `dfs(${node.val})` : 'dfs(None)')
      if (node) onStack.add(node.id)
      t.step(L.base, node ? `Enter dfs(${node.val}). Not empty, so keep going.` : `dfs(None): ${from ? `${from.val} has no child here` : 'empty tree'}. Base case!`, snap(node ?? from, { tone: node ? 'active' : 'warn' }))
      if (!node) {
        t.step(L.ret0, 'Return right away. Nothing to visit.', snap(from, { tone: 'warn' }))
        stack.pop()
        return
      }
      const lines: [keyof typeof L, () => void][] = []
      const visit = () => {
        result.push(node.val)
        visitedAt.set(node.id, result.length)
        t.step(L.visit, `Visit ${node.val} ${WHEN[order]}: result = [${result.join(', ')}].`, snap(node, { tone: 'match' }))
      }
      const goLeft = () => {
        t.step(L.left, `Go left from ${node.val}${node.left ? ` to ${node.left.val}` : ' (empty)'}.`, snap(node, { edge: node.left?.id }))
        dfs(node.left, node)
        t.step(L.left, `Back in dfs(${node.val}): left subtree done.`, snap(node))
      }
      const goRight = () => {
        t.step(L.right, `Go right from ${node.val}${node.right ? ` to ${node.right.val}` : ' (empty)'}.`, snap(node, { edge: node.right?.id }))
        dfs(node.right, node)
        t.step(L.right, `Back in dfs(${node.val}): right subtree done.`, snap(node))
      }
      if (order === 'pre') lines.push(['visit', visit], ['left', goLeft], ['right', goRight])
      if (order === 'in') lines.push(['left', goLeft], ['visit', visit], ['right', goRight])
      if (order === 'post') lines.push(['left', goLeft], ['right', goRight], ['visit', visit])
      lines.forEach(([, fn]) => fn())
      onStack.delete(node.id)
      finished.add(node.id)
      stack.pop()
    }

    t.step(L.res, 'result collects values in the order we visit them.', snap())
    t.step(L.def, 'Define the helper. Nothing runs yet.', snap())
    t.step(L.call, root ? `Start the recursion at the root, ${root.val}.` : 'Start the recursion on an empty tree.', snap(root))
    dfs(root)
    t.step(L.call, 'The outermost call returned: every node has been visited.', snap())
    t.step(L.ret, `Return [${result.join(', ')}].`, snap(), [...result])
    return t.steps
  }

  return { code, trace }
}

function traversal(order: Order): Animation<Input> {
  const { code, trace } = makeTracer(order)
  return {
    code,
    defaultInput: { tree: [1, 2, 3, 4, 5, null, 6] },
    examples: [
      { label: 'empty tree', input: { tree: [] } },
      { label: 'left-skewed', input: { tree: [1, 2, null, 3] } },
    ],
    trace,
    pyArgs: ({ tree }) => [pyTree(tree)],
    generate: (n) => ({ tree: randomTree(n) }),
    complexity: {
      time: 'O(n)',
      space: 'O(h)',
      timeClass: 'n',
      spaceClass: 'n',
      sizeLabel: 'n (nodes)',
      why: [
        'Each node is entered exactly once and does O(1) work. dfs(None) calls add at most n + 1 more, one per null pointer.',
        'The call stack holds one frame per node on the current root→node path: O(h), where h is the tree height.',
        'h is about log₂ n for a balanced tree but n for a skewed one (a "linked list"), so the worst case is O(n).',
        'The result list itself is O(n), but it is output, not extra working space.',
      ],
    },
  }
}

export const preorder = traversal('pre')
export const inorder = traversal('in')
export const postorder = traversal('post')

/** Most real (non-None) frames on the call stack at once, for the lesson's space chart. */
export function maxStackDepth(tree: TreeArray): number {
  const steps = preorder.trace({ tree })
  let max = 0
  for (const s of steps) for (const p of s.panels) if (p.kind === 'list') max = Math.max(max, p.items.filter((f) => f !== 'dfs(None)').length)
  return max
}

export const treeNodeCount = (tree: TreeArray) => nodes(buildTree(tree)).length
