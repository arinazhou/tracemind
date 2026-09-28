import { useMemo, useState, type ReactNode } from 'react'
import { maxStackDepth } from '../animations/treeTraversals'
import { CodeView } from '../components/CodeView'
import { GrowthChart } from '../components/GrowthChart'
import { Demo } from '../components/learn/Demo'
import { PracticeList, type Stage } from '../components/learn/PracticeList'
import { Quiz, type Question } from '../components/learn/Quiz'
import { TreeExplorer } from '../components/learn/TreeExplorer'
import { randomTree } from '../engine/tree'

// References: Hello Interview's DFS/BFS lessons (return values vs. passing values
// down) and UIUC CS 225's tree lectures (height = edges, empty tree = −1,
// full/perfect/complete, n + 1 null pointers).

const SECTIONS = [
  ['basics', 'Vocabulary'],
  ['traversals', 'Traversals'],
  ['mindset', 'Recursion mindset'],
  ['templates', '4 templates'],
  ['bst', 'BSTs'],
  ['bigo', 'Big-O'],
  ['tricks', 'Tricks & pitfalls'],
  ['choose', 'Which template?'],
  ['quiz', 'Quiz'],
  ['practice', 'Practice path'],
] as const

const NODE_CLASS = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left     # another TreeNode, or None
        self.right = right   # another TreeNode, or None`

const TEMPLATES: { id: string; name: string; tag: string; when: string; code: string; recipe: string[]; demo: [number, string] }[] = [
  {
    id: 'A', name: 'Bottom-up (return values)', tag: 'answers flow UP',
    when: 'The answer for a node depends on answers from its subtrees: height, size, sum, "is it balanced?", "is it the same tree?".',
    code: `def solve(root):
    def dfs(node):
        if not node:
            return BASE                  # answer for an EMPTY tree
        left = dfs(node.left)            # trust it: left subtree's answer
        right = dfs(node.right)          # trust it: right subtree's answer
        return combine(node.val, left, right)
    return dfs(root)`,
    recipe: [
      'Decide what dfs(node) returns for its subtree. Write it down in one sentence.',
      'Base case: what should an empty tree return? (0, True, None, −∞ …)',
      'Combine: assuming left and right are correct, how do you get this node\'s answer?',
    ],
    demo: [104, 'Maximum Depth of Binary Tree'],
  },
  {
    id: 'B', name: 'Top-down (pass values down)', tag: 'context flows DOWN',
    when: 'A node needs information from its ancestors: running path sum, allowed (low, high) range, max value so far, current depth.',
    code: `def solve(root):
    def dfs(node, state):                # state = what ancestors tell you
        if not node:
            return
        # use or check \`state\` at this node
        dfs(node.left, update(state, node))
        dfs(node.right, update(state, node))
    dfs(root, initial_state)`,
    recipe: [
      'Ask: what does a node need to know about the path above it? That becomes a parameter.',
      'Pass an UPDATED copy to each child (numbers and tuples are safe; lists need copying or undoing).',
      'Record the answer at the right node, often at a leaf (not node.left and not node.right).',
    ],
    demo: [98, 'Validate Binary Search Tree'],
  },
  {
    id: 'C', name: 'BFS level by level', tag: 'rows, not paths',
    when: 'The problem talks about levels or rows: level order, right side view, zigzag, level averages, width, or the nearest/shallowest node.',
    code: `from collections import deque

def solve(root):
    if not root:
        return []
    queue = deque([root])
    while queue:
        for _ in range(len(queue)):      # snapshot: exactly one level
            node = queue.popleft()
            # process node (first/last of the level, running sum, ...)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        # a full level just finished here`,
    recipe: [
      'Seed the queue with the root.',
      'Take len(queue) BEFORE the inner loop. That is the size of the current level.',
      'Children you enqueue now belong to the next level and wait their turn.',
    ],
    demo: [102, 'Binary Tree Level Order Traversal'],
  },
  {
    id: 'D', name: 'Bottom-up + global answer', tag: 'answer ≠ return value',
    when: 'The answer is a path that can BEND through a node (diameter, max path sum, longest univalue path), but a parent can only extend one side.',
    code: `def solve(root):
    best = INITIAL
    def dfs(node):
        nonlocal best                    # needed to reassign an int/float
        if not node:
            return BASE
        left, right = dfs(node.left), dfs(node.right)
        best = max(best, through(node, left, right))  # path bends HERE
        return one_side(node, left, right)            # parent extends ONE arm
    dfs(root)
    return best`,
    recipe: [
      'Two different quantities: what you RETURN (one arm, usable by the parent) and what you RECORD (the bent path).',
      'Update the global at every node, since any node may be the top of the best path.',
      'Return only the one-sided value. Returning the bent path is the #1 bug.',
    ],
    demo: [543, 'Diameter of Binary Tree'],
  },
]

const TRICKS: [string, ReactNode][] = [
  ['Write the base case first', <>Every tree recursion starts with <code>if not node: return …</code>. Choose the value that makes the combine step work: 0 for sums/depths, <code>True</code> for "all nodes satisfy…", <code>-inf</code> for maximums.</>],
  ['Trust the recursion ("leap of faith")', <>Don't trace the whole tree in your head. Assume <code>dfs(node.left)</code> already returns the right answer for that subtree, and only ask how to use it.</>],
  ['Depth vs. height: count carefully', <>CS 225 height counts <b>edges</b> (a single node has height 0, an empty tree −1). LeetCode's <i>maximum depth</i> counts <b>nodes</b> (a single node → 1), and <i>diameter</i> counts <b>edges</b>. Read the examples to see which one the problem uses.</>],
  ['A leaf has NO children', <>Root-to-leaf problems (Path Sum) must check <code>not node.left and not node.right</code>. A node with one child is not a leaf, and stopping at <code>None</code> can count a path that ends halfway.</>],
  ['BST: bounds, not parents', <>Checking <code>left.val &lt; node.val</code> only against the parent misses violations from ancestors. Pass <code>(low, high)</code> down, or check that in-order is strictly increasing.</>],
  ['In-order of a BST is sorted', <>Kth smallest, "two sum in a BST", recovering swapped nodes, and validation all become array problems once you walk in-order.</>],
  ['Return value ≠ answer', <>When the answer can bend through a node, keep a <code>best</code> outside and return only one arm (template D).</>],
  ['nonlocal for numbers', <>A nested function can read an outer <code>best</code>, but reassigning it needs <code>nonlocal best</code>. Otherwise you get an <code>UnboundLocalError</code>. Mutating a list (<code>ans.append</code>) doesn't need it.</>],
  ['Backtracking paths: undo what you add', <>When collecting root-to-leaf paths in one shared list: <code>path.append(x)</code> → recurse → <code>path.pop()</code>, and save <code>path[:]</code> (a copy), not <code>path</code>.</>],
  ['Snapshot the level size', <>In BFS, <code>for _ in range(len(queue))</code> is evaluated once, before children are added. That is what separates levels.</>],
  ['Deep trees vs. Python\'s recursion limit', <>Python stops at about 1000 frames. A skewed tree with 10⁴ nodes crashes a recursive DFS, so raise <code>sys.setrecursionlimit</code> or switch to an explicit stack.</>],
  ['Avoid recomputing subtrees', <>Calling <code>height()</code> inside every node of a balanced check is O(n²). Return everything the parent needs in ONE pass (e.g., height, or −1 meaning "unbalanced").</>],
]

const CHOOSER: [string, string, string][] = [
  ['It needs a fact about the whole subtree (height, size, sum, same shape?)', 'A · Bottom-up', 'Maximum Depth, Balanced, Same Tree, Invert'],
  ['It needs context from above (path so far, bounds, max so far)', 'B · Top-down', 'Path Sum, Validate BST, Count Good Nodes'],
  ['It mentions levels, rows, width, "right side", or shortest depth', 'C · BFS', 'Level Order, Right Side View, Zigzag'],
  ['The answer is a path that can bend through any node', 'D · Bottom-up + global', 'Diameter, Max Path Sum, Longest Univalue Path'],
  ['The tree is a BST', 'Use the order', 'go left/right in O(h), or in-order = sorted'],
]

const QUESTIONS: Question[] = [
  { q: 'Which traversal visits a BST\'s values in sorted order?', options: ['Pre-order', 'In-order', 'Post-order', 'Level order'], answer: 1, why: 'In-order goes left subtree (smaller) → node → right subtree (larger).' },
  { q: 'A binary tree has n nodes. How many null child pointers does it have?', options: ['n − 1', 'n', 'n + 1', '2n'], answer: 2, why: 'There are 2n child slots and n − 1 edges fill them, so 2n − (n − 1) = n + 1 are null (CS 225).' },
  { q: 'Recursive DFS on a completely skewed tree with n nodes uses how much stack space?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, why: 'Stack depth = height, and a skewed tree has height n − 1. That is why we say O(h), not O(log n).' },
  { q: '"A node is good if no node on the path from the root to it has a greater value." Which template?', options: ['A · Bottom-up', 'B · Top-down', 'C · BFS', 'D · Global'], answer: 1, why: 'Each node needs the max value on the path ABOVE it, which is context flowing down (LeetCode 1448).' },
  { q: 'In Binary Tree Maximum Path Sum, what should dfs(node) return to its parent?', options: ['The best path bending through node', 'The best path starting at node going down ONE side', 'The sum of the whole subtree', 'The number of nodes'], answer: 1, why: 'A parent can only extend one arm. The bent path is recorded in a global (template D).' },
  { q: 'Using CS 225\'s definition, what is the height of a tree with exactly one node?', options: ['−1', '0', '1', '2'], answer: 1, why: 'Height counts edges on the longest root→leaf path. One node has no edges → 0 (empty tree = −1). LeetCode\'s "max depth" would say 1.' },
  { q: 'Why does level-order BFS use for _ in range(len(queue))?', options: ['It is faster than while', 'To process exactly one level before its children', 'To avoid None nodes', 'Python requires it'], answer: 1, why: 'len(queue) is read once, before children are appended, so the loop stops at the level boundary.' },
]

const STAGES: Stage[] = [
  {
    title: 'Stage 1 · Warm up', goal: 'Get fluent with traversal and the base case',
    items: [
      { num: 144, template: 'traversal', hint: 'Visit, then left, then right. Or iteratively: a stack, pushing right before left.' },
      { num: 94, template: 'traversal', hint: 'Left, visit, right. The iterative version (go left as far as possible, pop, go right) is a classic interview follow-up.' },
      { num: 104, template: 'A · bottom-up', hint: 'Empty → 0. Otherwise 1 + max(left, right).' },
      { num: 226, template: 'A · bottom-up', hint: 'Swap node.left and node.right, then recurse. Any traversal order works.' },
      { num: 100, template: 'A · bottom-up', hint: 'Both None → True. One None or values differ → False. Otherwise both subtrees must match.' },
      { num: 101, template: 'A · bottom-up', hint: 'Write mirror(a, b): compare a.left with b.right and a.right with b.left.' },
    ],
  },
  {
    title: 'Stage 2 · Pick the template', goal: 'Easy problems, one pattern each',
    items: [
      { num: 112, template: 'B · top-down', hint: 'Pass the remaining sum down. Check it only at a real leaf.' },
      { num: 110, template: 'A · bottom-up', hint: 'Return height, or −1 as a "not balanced" signal so the check stays O(n).' },
      { num: 543, template: 'D · global', hint: 'best = max(best, left + right); return 1 + max(left, right).' },
      { num: 572, template: 'A · bottom-up', hint: 'At every node of the big tree, ask "Same Tree?" (reuse LeetCode 100).' },
      { num: 700, template: 'BST', hint: 'Go left if target < node.val, else right. O(h), no recursion needed.' },
    ],
  },
  {
    title: 'Stage 3 · Your first mediums', goal: 'The goal of this page',
    items: [
      { num: 102, template: 'C · BFS', hint: 'The BFS template above, verbatim.' },
      { num: 199, template: 'C · BFS', hint: 'The last node of each level. (DFS alternative: visit right first and record the first node seen at each depth.)' },
      { num: 98, template: 'B · top-down', hint: 'Pass (low, high). Left child gets (low, node.val), right gets (node.val, high).' },
      { num: 230, template: 'BST in-order', hint: 'In-order is sorted, so count down k and stop early.' },
      { num: 235, template: 'BST', hint: 'If both targets are smaller, go left. Both larger, go right. Otherwise this node is the split point.' },
      { num: 1448, template: 'B · top-down', hint: 'Pass max_so_far down. The node is good if node.val >= max_so_far.' },
      { num: 113, template: 'B + backtracking', hint: 'Keep one path list: append, recurse, pop. Save path[:] at matching leaves.' },
      { num: 236, template: 'A · bottom-up', hint: 'Return the node if it is p or q. If both sides return something, you are the LCA.' },
      { num: 105, template: 'divide & conquer', hint: 'preorder[0] is the root. Its index in inorder splits left and right. Use a dict for O(1) lookup.' },
    ],
  },
  {
    title: 'Stage 4 · Stretch', goal: 'When mediums feel comfortable',
    items: [
      { num: 437, template: 'B + prefix sums', hint: 'Carry a counter of prefix sums down the path, like Subarray Sum Equals K on a tree.' },
      { num: 124, template: 'D · global', hint: 'Diameter, but with values: clamp negative arms to 0.' },
      { num: 297, template: 'traversal', hint: 'Pre-order with "#" for None round-trips uniquely.' },
    ],
  },
]

export function LearnTrees() {
  const [demo, setDemo] = useState<string | null>(null)
  const toggle = (id: string) => setDemo((d) => (d === id ? null : id))
  const [chartSeed, setChartSeed] = useState(0)

  const sizes = [4, 8, 16, 24, 32, 48, 64, 96, 128]
  const depthSeries = useMemo(() => [
    { name: 'skewed tree', values: sizes.map((n) => maxStackDepth(randomTree(n, 'skewed'))), style: 'solid' as const },
    { name: 'balanced tree', values: sizes.map((n) => maxStackDepth(randomTree(n, 'balanced'))), style: 'dash' as const },
  ], [chartSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="lesson">
      <div className="eyebrow">Learn · Data structures</div>
      <h1 className="page-title">Trees, from "a little" to LeetCode mediums</h1>
      <p className="lede">
        About 45 minutes. You'll learn the vocabulary, four traversals, <b>four templates</b> that cover most interview
        tree problems, how to tell which one a problem wants, and the Big-O behind them. Every animation runs real
        Python solutions step by step. Press <span className="kbd">←</span> <span className="kbd">→</span> to step.
      </p>

      <nav className="toc">
        {SECTIONS.map(([id, label], i) => <button key={id} onClick={() => jump(id)}><span>{i + 1}</span>{label}</button>)}
      </nav>

      {/* 1 ---------------------------------------------------------------- */}
      <Section id="basics" n={1} title="Vocabulary: what a tree is">
        <p>
          A <b>binary tree</b> is either <b>empty</b>, or a <b>node</b> with a value and two children, a left
          and a right, each of which is again a binary tree. That recursive definition (from CS 225) is the key to
          everything below: <i>a tree is a node plus two smaller trees</i>, so tree code is naturally recursive.
        </p>
        <div className="two-col">
          <div className="card code-card" style={{ position: 'static' }}><CodeView code={NODE_CLASS} /></div>
          <ul className="terms">
            <li><b>root</b>: the top node, with no parent</li>
            <li><b>leaf</b>: a node with <i>no</i> children</li>
            <li><b>depth</b> of a node: edges from the root down to it</li>
            <li><b>height</b> of a node: edges down to its deepest leaf. Height of the tree = height of the root. Empty tree = −1</li>
            <li><b>subtree</b>: a node together with all of its descendants</li>
          </ul>
        </div>
        <TreeExplorer />
        <Callout kind="cs225" title="CS 225 facts worth memorizing">
          n nodes ⇒ exactly n − 1 edges and n + 1 null pointers. A perfect tree of height h has 2<sup>h+1</sup> − 1 nodes,
          so a tree with n nodes has height at least ⌊log₂ n⌋ and at most n − 1. That range is why tree Big-O is
          written in terms of <b>h</b>.
        </Callout>
      </Section>

      {/* 2 ---------------------------------------------------------------- */}
      <Section id="traversals" n={2} title="Traversals: four ways to visit every node">
        <p>
          Depth-first traversals all walk the same path: down the left, back up, down the right. The only difference
          is <b>when you "visit"</b> the node relative to its children. Watch the purple highlight: it is always
          the same three lines, reordered.
        </p>
        <div className="order-grid">
          <div><b>Pre-order</b><span>node → left → right</span><em>copy / serialize a tree</em></div>
          <div><b>In-order</b><span>left → node → right</span><em>BST → sorted order</em></div>
          <div><b>Post-order</b><span>left → right → node</span><em>children first: heights, deleting</em></div>
          <div><b>Level order</b><span>row by row (BFS)</span><em>anything about levels</em></div>
        </div>
        <Demo num={144} title="Preorder Traversal" open={demo === 'pre'} onToggle={() => toggle('pre')} />
        <Demo num={94} title="Inorder Traversal" open={demo === 'in'} onToggle={() => toggle('in')} />
        <Demo num={145} title="Postorder Traversal" open={demo === 'post'} onToggle={() => toggle('post')} />
        <Callout kind="tip" title="Read the call stack panel">
          Each frame is a paused function waiting for a child to return. The stack is never taller than the tree,
          which is where O(h) space comes from.
        </Callout>
      </Section>

      {/* 3 ---------------------------------------------------------------- */}
      <Section id="mindset" n={3} title="The recursion mindset">
        <p>
          Beginners try to simulate the whole tree. Don't. Solve the problem <b>for one node</b>, assuming your function
          already works on its two children. That trust is valid because the children's trees are strictly smaller and
          the empty tree is handled directly. It is the same induction CS 225 uses to prove tree theorems.
        </p>
        <div className="flow">
          <div><span>1</span><b>Base case</b>What does an <i>empty</i> tree answer?</div>
          <div><span>2</span><b>Trust</b>Pretend dfs(left) and dfs(right) are correct.</div>
          <div><span>3</span><b>Combine</b>Build this node's answer from those two + node.val.</div>
        </div>
        <p>
          Then ask one question to pick a direction: <b>does this node need information from BELOW</b> (its subtrees)
          or <b>from ABOVE</b> (the path from the root)? Below → return values. Above → parameters. Hello Interview
          teaches these as "return values" vs. "passing values down with helper functions". They are templates A and B.
        </p>
      </Section>

      {/* 4 ---------------------------------------------------------------- */}
      <Section id="templates" n={4} title="The four templates">
        <p>Memorize these shapes. Most interview tree problems are one of them, or two combined.</p>
        {TEMPLATES.map((t) => (
          <div key={t.id} className="card template">
            <div className="template-head">
              <span className="template-id">{t.id}</span>
              <div><h3>{t.name}</h3><span className="muted">{t.tag}</span></div>
            </div>
            <p className="template-when"><b>Use when:</b> {t.when}</p>
            <div className="two-col template-body">
              <div className="card code-card" style={{ position: 'static', boxShadow: 'none' }}><CodeView code={t.code} /></div>
              <ol className="recipe">{t.recipe.map((r) => <li key={r}>{r}</li>)}</ol>
            </div>
            <Demo num={t.demo[0]} title={t.demo[1]} open={demo === t.id} onToggle={() => toggle(t.id)} />
          </div>
        ))}
      </Section>

      {/* 5 ---------------------------------------------------------------- */}
      <Section id="bst" n={5} title="Binary search trees">
        <p>
          A <b>BST</b> adds one rule: for every node, <i>everything</i> in its left subtree is smaller and <i>everything</i>
          in its right subtree is larger. It's not just the direct children, and the validation demo above shows a tree
          that fools the parent-only check.
        </p>
        <div className="two-col">
          <div className="card code-card" style={{ position: 'static' }}>
            <CodeView code={`def search(node, target):          # LeetCode 700
    while node and node.val != target:
        node = node.left if target < node.val else node.right
    return node                        # O(h): one path, not the whole tree

def inorder(node):                     # yields values in SORTED order
    if node:
        yield from inorder(node.left)
        yield node.val
        yield from inorder(node.right)`} />
          </div>
          <ul className="terms">
            <li><b>Search / insert / delete</b> each follow a single root→leaf path: <b>O(h)</b>.</li>
            <li><b>In-order = sorted</b>, which turns kth-smallest and validation into array problems.</li>
            <li>Insert sorted data into a plain BST and it becomes <b>skewed</b>: h = n − 1, and O(h) is really O(n).</li>
            <li>CS 225 fixes that with <b>AVL trees</b>: rotations keep |height(left) − height(right)| ≤ 1, so h = O(log n). You won't code AVL in interviews, but know that it's why balanced BSTs get O(log n).</li>
          </ul>
        </div>
      </Section>

      {/* 6 ---------------------------------------------------------------- */}
      <Section id="bigo" n={6} title="Big-O analysis">
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="ptable cx-table">
            <thead><tr><th>Operation</th><th>Time</th><th>Extra space</th><th>Why</th></tr></thead>
            <tbody>
              <tr><td>Any full traversal (pre/in/post)</td><td>O(n)</td><td>O(h)</td><td>each node once; stack = current path</td></tr>
              <tr><td>Level order (BFS)</td><td>O(n)</td><td>O(w)</td><td>queue ≈ widest level, up to ~n/2</td></tr>
              <tr><td>BST search / insert / delete</td><td>O(h)</td><td>O(1) iterative</td><td>one root→leaf path</td></tr>
              <tr><td>Balanced check that recomputes height</td><td>O(n²) worst</td><td>O(h)</td><td>height() re-walks subtrees at every node</td></tr>
              <tr><td>…returning height in the same pass</td><td>O(n)</td><td>O(h)</td><td>template A, one visit per node</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          <b>h ranges from about log₂ n (balanced) to n − 1 (skewed).</b> Always say "O(h)" and then state both cases.
          Interviewers look for that. Here is the call-stack depth measured from the traversal animation's own tracer,
          on random trees of each shape:
        </p>
        <div className="card panel">
          <div className="panel-title">Max call-stack depth vs. number of nodes n</div>
          <div style={{ maxWidth: 640 }}><GrowthChart xs={sizes} series={depthSeries} yLabel="frames" /></div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => setChartSeed((s) => s + 1)}>↻ New random trees</button>
        </div>
        <Callout kind="tip" title="Counting time in recursion">
          Total time = (number of calls) × (work per call, excluding the recursive calls). A traversal makes about 2n + 1
          calls (n nodes + n + 1 empty children) doing O(1) each, so it's O(n).
        </Callout>
      </Section>

      {/* 7 ---------------------------------------------------------------- */}
      <Section id="tricks" n={7} title="Tricks & pitfalls">
        <div className="tricks">
          {TRICKS.map(([t, body], i) => (
            <div key={t} className="card trick"><span className="trick-n">{i + 1}</span><div><b>{t}</b><p>{body}</p></div></div>
          ))}
        </div>
      </Section>

      {/* 8 ---------------------------------------------------------------- */}
      <Section id="choose" n={8} title="Which template does this problem want?">
        <div className="chooser">
          {CHOOSER.map(([signal, t, ex]) => (
            <div key={signal} className="chooser-row">
              <span className="chooser-if">If {signal.charAt(0).toLowerCase() + signal.slice(1)}</span>
              <span className="chooser-arrow">→</span>
              <span className="chooser-then"><b>{t}</b><em>{ex}</em></span>
            </div>
          ))}
        </div>
      </Section>

      {/* 9 ---------------------------------------------------------------- */}
      <Section id="quiz" n={9} title="Check yourself">
        <Quiz questions={QUESTIONS} />
      </Section>

      {/* 10 --------------------------------------------------------------- */}
      <Section id="practice" n={10} title="Practice path: easy → medium">
        <p>
          Do them in order. Before coding, name the template out loud, and only open the hint if you're stuck for 10+
          minutes. When Stage 3 feels routine, you're ready for tree mediums in general.
        </p>
        <PracticeList stages={STAGES} />
        <p className="faint" style={{ fontSize: 12, marginTop: 16 }}>
          References: Hello Interview's DFS &amp; BFS lessons (return values, passing values down, level order) and
          UIUC CS 225's tree lectures (definitions of height, full/perfect/complete, the n + 1 null pointer theorem, BST and AVL).
        </p>
      </Section>
    </div>
  )
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="lesson-section">
      <h2><span className="sec-n">{n}</span>{title}</h2>
      {children}
    </section>
  )
}

function Callout({ kind, title, children }: { kind: 'tip' | 'cs225'; title: string; children: ReactNode }) {
  return (
    <div className={`callout callout-${kind}`}>
      <b>{kind === 'cs225' ? '📘 ' : '💡 '}{title}</b>
      <p>{children}</p>
    </div>
  )
}
