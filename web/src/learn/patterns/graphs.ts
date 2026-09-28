import type { Pattern } from '../types'

export const dfs: Pattern = {
  id: 'dfs', title: 'Depth-First Search', hue: 140,
  short: 'Go deep before wide, with recursion or an explicit stack, over trees, grids, and graphs.',
  signals: [
    'Any binary-tree problem (start here, then see the Trees page)',
    'Explore everything connected: islands, flood fill, provinces',
    'Path existence, clone a graph, count components',
    'Cycle detection in a graph',
  ],
  idea: 'On trees, DFS comes in two directions: bottom-up (each call RETURNS an answer about its subtree) and top-down (each call RECEIVES context from its ancestors as parameters). On graphs and grids it\'s the same recursion plus a visited set, because graphs can have cycles. Mark a node visited as soon as you enter it.',
  templates: [
    {
      name: 'Tree DFS (bottom-up)',
      code: `def dfs(node):
    if not node:
        return BASE                      # answer for an empty tree
    left = dfs(node.left)                # trust the recursion
    right = dfs(node.right)
    return COMBINE(node.val, left, right)`,
      steps: ['Say in one sentence what dfs(node) returns.', 'Base case first.', 'Combine the children\'s answers. The Trees page has all 4 tree templates animated.'],
    },
    {
      name: 'Graph / grid DFS with visited',
      code: `visited = set()

def dfs(node):
    visited.add(node)                    # mark on entry
    for nxt in graph[node]:
        if nxt not in visited:
            dfs(nxt)

components = 0
for node in graph:
    if node not in visited:
        dfs(node)                        # explores one whole component
        components += 1`,
      steps: ['Grids: neighbors are the 4 directions, with a bounds check before indexing.', 'On grids you can mark cells in place (grid[r][c] = "#") instead of using a set.', 'The outer loop starts a new DFS for every unvisited node, one per component.'],
    },
  ],
  demos: [104, 98, 543, 144],
  complexity: [
    ['Tree DFS', 'O(n)', 'O(h)', 'each node once; stack = current path'],
    ['Graph DFS (adjacency list)', 'O(V + E)', 'O(V)', 'each vertex once, each edge twice'],
    ['Grid DFS', 'O(m·n)', 'O(m·n)', 'worst-case recursion depth is every cell'],
  ],
  tips: [
    'Python\'s default recursion limit is about 1000. Big grids need sys.setrecursionlimit or an explicit stack.',
    'Directed cycle detection needs 3 states: unvisited / on the current path / finished.',
    'Undirected graphs: don\'t count the edge back to your parent as a cycle.',
    'Clone Graph: a dict old → new doubles as the visited set.',
    'Pacific Atlantic / Surrounded Regions: DFS from the BORDER inward, not from every cell.',
  ],
  ds: ['trees', 'graphs'],
  cs225: 'Graph traversals: DFS classifies edges as discovery (tree) edges and back edges, and a back edge means a cycle. With an adjacency list, BFS and DFS are both O(n + m). Tree traversals are covered in CS 225\'s tree lectures.',
  stages: [
    { title: 'Trees: warm up (see the Trees page)', items: [
      [144, 'Binary Tree Preorder Traversal', 'E', 'Visit, left, right.', 'traversal'],
      [94, 'Binary Tree Inorder Traversal', 'E', 'Left, visit, right. Also practice it iteratively.', 'traversal'],
      [145, 'Binary Tree Postorder Traversal', 'E', 'Left, right, visit.', 'traversal'],
      [104, 'Maximum Depth of Binary Tree', 'E', '1 + max(left, right); empty → 0.', 'bottom-up'],
      [226, 'Invert Binary Tree', 'E', 'Swap children, recurse.', 'bottom-up'],
      [100, 'Same Tree', 'E', 'Both None → True; values differ → False; recurse on both sides.', 'bottom-up'],
      [101, 'Symmetric Tree', 'E', 'mirror(a, b): a.left with b.right, a.right with b.left.', 'bottom-up'],
    ] },
    { title: 'Trees: pick the template', items: [
      [112, 'Path Sum', 'E', 'Pass the remaining sum down; check at a real leaf.', 'top-down'],
      [110, 'Balanced Binary Tree', 'E', 'Return height, or −1 for "unbalanced".', 'bottom-up'],
      [543, 'Diameter of Binary Tree', 'E', 'Global best = left + right; return 1 + max.', 'global'],
      [563, 'Binary Tree Tilt', 'E', 'Return the subtree sum; add |left − right| to a global.', 'global'],
      [572, 'Subtree of Another Tree', 'E', 'At each node, run Same Tree.', 'bottom-up'],
      [700, 'Search in a Binary Search Tree', 'E', 'Go left or right. O(h), no recursion needed.', 'BST'],
      [98, 'Validate Binary Search Tree', 'M', 'Pass (low, high) down.', 'top-down'],
      [230, 'Kth Smallest Element in a BST', 'M', 'In-order is sorted; stop at the k-th.', 'BST in-order'],
      [235, 'Lowest Common Ancestor of a Binary Search Tree', 'M', 'Both smaller → left; both larger → right; else here.', 'BST'],
      [701, 'Insert into a Binary Search Tree', 'M', 'Walk down to a None slot and attach.', 'BST'],
      [1448, 'Count Good Nodes in Binary Tree', 'M', 'Pass max_so_far down.', 'top-down'],
      [113, 'Path Sum II', 'M', 'Top-down + path list with append/pop; save path[:] at leaves.', 'top-down + backtracking'],
      [236, 'Lowest Common Ancestor of a Binary Tree', 'M', 'Return the node if it is p or q; if both sides return non-None, you are the LCA.', 'bottom-up'],
      [687, 'Longest Univalue Path', 'M', 'Diameter-style: extend an arm only if the child has the same value.', 'global'],
      [114, 'Flatten Binary Tree to Linked List', 'M', 'Reverse pre-order (right, left, node) with a prev pointer.', 'traversal'],
      [105, 'Construct Binary Tree from Preorder and Inorder Traversal', 'M', 'preorder[0] = root; its inorder index splits the subtrees.', 'divide & conquer'],
      [450, 'Delete Node in a BST', 'M', 'Two children → replace with the in-order successor, then delete that.', 'BST'],
    ] },
    { title: 'Graphs & grids', items: [
      [733, 'Flood Fill', 'E', 'Grid DFS; return early if the color is already the new color.', 'grid'],
      [695, 'Max Area of Island', 'M', 'Grid DFS returning the island size.', 'grid'],
      [133, 'Clone Graph', 'M', 'dict old → new is also the visited set.', 'graph'],
      [130, 'Surrounded Regions', 'M', 'DFS from border O\'s; everything unmarked flips.', 'grid'],
      [417, 'Pacific Atlantic Water Flow', 'M', 'DFS uphill from each ocean\'s border; intersect.', 'grid'],
      [261, 'Graph Valid Tree', 'M', 'n − 1 edges and connected (DFS or union-find).', 'graph'],
    ] },
    { title: 'Stretch', items: [
      [437, 'Path Sum III', 'M', 'Prefix sums along the root→node path, in a Counter.', 'top-down + prefix'],
      [124, 'Binary Tree Maximum Path Sum', 'H', 'Diameter with values; clamp negative arms to 0.', 'global'],
      [297, 'Serialize and Deserialize Binary Tree', 'H', 'Pre-order with "#" for None.', 'traversal'],
    ] },
  ],
}

export const bfs: Pattern = {
  id: 'bfs', title: 'Breadth-First Search', hue: 210,
  short: 'Explore level by level with a queue: shortest paths in unweighted graphs, and anything about tree levels.',
  signals: [
    '"Minimum steps / moves / distance" with unweighted edges',
    'Levels, rows, right side view, zigzag',
    'Something spreads from several sources at once (rotting oranges, 01 matrix)',
    'State-space puzzles: open the lock, word ladder',
  ],
  idea: 'A queue processes nodes in order of their distance from the start, so the first time BFS reaches a node, it got there by a shortest path. Snapshot len(queue) to process exactly one level at a time. Mark nodes visited when you ENQUEUE them, not when you pop them, or the same node gets queued many times.',
  templates: [
    {
      name: 'Shortest path (unweighted)',
      code: `from collections import deque

queue = deque([start])
visited = {start}
steps = 0
while queue:
    for _ in range(len(queue)):      # exactly one level
        node = queue.popleft()
        if node == target:
            return steps
        for nxt in neighbors(node):
            if nxt not in visited:
                visited.add(nxt)     # mark on ENQUEUE
                queue.append(nxt)
    steps += 1
return -1`,
      steps: ['Multi-source: seed the queue with ALL sources at distance 0.', 'Tree level order is the same loop without visited (trees have no cycles).', 'Grids: neighbors = 4 directions + bounds + "not a wall".'],
    },
  ],
  demos: [102, 200],
  complexity: [
    ['Graph BFS', 'O(V + E)', 'O(V)', 'each vertex enqueued once'],
    ['Grid BFS', 'O(m·n)', 'O(m·n)', 'each cell enqueued once'],
    ['Tree level order', 'O(n)', 'O(w)', 'w = widest level'],
  ],
  tips: [
    'Use collections.deque. list.pop(0) is O(n), which quietly makes BFS O(n²).',
    'Weighted edges → Dijkstra. Weights of only 0 or 1 → 0-1 BFS with appendleft.',
    'Word Ladder: generate neighbors by changing one letter; bidirectional BFS for speed.',
    'Right Side View: the last node of each level.',
  ],
  ds: ['graphs', 'trees', 'stacks-queues'],
  cs225: 'BFS builds a tree of fewest-edge paths from the start: O(n + m) on an adjacency list. Queues are CS 225\'s stacks & queues lecture.',
  stages: [
    { title: 'Trees', items: [
      [102, 'Binary Tree Level Order Traversal', 'M', 'The level template.', 'levels'],
      [199, 'Binary Tree Right Side View', 'M', 'Last node of each level.', 'levels'],
      [103, 'Binary Tree Zigzag Level Order Traversal', 'M', 'Reverse every other level.', 'levels'],
      [662, 'Maximum Width of Binary Tree', 'M', 'Carry position indices (2i, 2i + 1); width = last − first + 1.', 'levels'],
    ] },
    { title: 'Grids & graphs', items: [
      [200, 'Number of Islands', 'M', 'For each unvisited land cell, BFS (or DFS) and count.', 'components'],
      [994, 'Rotting Oranges', 'M', 'Multi-source BFS; minutes = levels.', 'multi-source'],
      [542, '01 Matrix', 'M', 'Multi-source BFS from every 0.', 'multi-source'],
      [286, 'Walls and Gates', 'M', 'Multi-source BFS from gates.', 'multi-source'],
      [1091, 'Shortest Path in Binary Matrix', 'M', '8 directions; start at distance 1.', 'shortest path'],
      [1197, 'Minimum Knight Moves', 'M', 'BFS on (x, y); use symmetry (abs) to shrink the search.', 'shortest path'],
      [752, 'Open the Lock', 'M', 'States are 4-digit strings; neighbors turn one wheel ±1.', 'state space'],
    ] },
    { title: 'Stretch', items: [
      [127, 'Word Ladder', 'H', 'Wildcard buckets ("h*t") to find neighbors fast.', 'state space'],
      [815, 'Bus Routes', 'H', 'BFS over ROUTES, not stops.', 'state space'],
    ] },
  ],
}

export const backtracking: Pattern = {
  id: 'backtracking', title: 'Backtracking', hue: 350,
  short: 'Build candidates one choice at a time and undo each choice after exploring it.',
  signals: ['"All" subsets / permutations / combinations / partitions', 'Constraint puzzles (N-Queens, Sudoku)', 'Word search on a grid', 'Small n (≤ 20)'],
  idea: 'The recursion walks a decision tree. At every level: choose, explore, un-choose. The "un-choose" step is what lets one shared path list serve every branch. Prune early: skip a branch as soon as it can\'t lead to a valid answer.',
  templates: [
    {
      name: 'Choose → explore → un-choose',
      code: `result, path = [], []

def backtrack(start):
    if IS_COMPLETE(path):
        result.append(path[:])            # save a COPY
        return
    for i in range(start, len(choices)):
        if not VALID(choices[i]):
            continue                      # prune
        path.append(choices[i])           # choose
        backtrack(i + 1)                  # explore (i to allow reuse)
        path.pop()                        # un-choose

backtrack(0)`,
      steps: ['Subsets: save at EVERY node (no completeness check).', 'Combinations: recurse with i + 1; combination sum with reuse: recurse with i.', 'Permutations: loop over everything with a used[] array instead of start.', 'Duplicates: sort, then skip when i > start and nums[i] == nums[i − 1].'],
    },
  ],
  complexity: [
    ['Subsets', 'O(n · 2ⁿ)', 'O(n)', '2ⁿ subsets, each copied in O(n)'],
    ['Permutations', 'O(n · n!)', 'O(n)', 'n! leaves'],
    ['Word Search', 'O(m·n · 3^L)', 'O(L)', '3 new directions per step'],
  ],
  tips: [
    'path[:] not path. Otherwise every saved answer is the same list, emptied at the end.',
    'Grid backtracking: mark the cell, recurse, then UNMARK it.',
    'N-Queens: sets for columns, r + c diagonals and r − c anti-diagonals give O(1) conflict checks.',
    'Palindrome Partitioning: choose the next cut position; precompute palindromes to speed it up.',
  ],
  ds: ['trees', 'arrays'],
  stages: [
    { title: 'Core shapes', items: [
      [78, 'Subsets', 'M', 'Save at every node; recurse with i + 1.', 'subsets'],
      [90, 'Subsets II', 'M', 'Sort; skip equal siblings.', 'subsets'],
      [77, 'Combinations', 'M', 'Stop when len(path) == k.', 'combinations'],
      [39, 'Combination Sum', 'M', 'Reuse allowed: recurse with i.', 'combinations'],
      [40, 'Combination Sum II', 'M', 'Sort, skip equal siblings, recurse with i + 1.', 'combinations'],
      [46, 'Permutations', 'M', 'used[] array; loop over everything.', 'permutations'],
      [47, 'Permutations II', 'M', 'Sort; skip if nums[i] == nums[i − 1] and not used[i − 1].', 'permutations'],
    ] },
    { title: 'Applied', items: [
      [17, 'Letter Combinations of a Phone Number', 'M', 'One level per digit.', 'product'],
      [22, 'Generate Parentheses', 'M', 'Add "(" if open < n; add ")" if close < open.', 'constrained'],
      [79, 'Word Search', 'M', 'Grid DFS with mark/unmark.', 'grid'],
      [131, 'Palindrome Partitioning', 'M', 'Choose the next cut; only recurse on palindromic prefixes.', 'partition'],
      [51, 'N-Queens', 'H', 'Row by row; sets for columns and both diagonals.', 'constrained'],
    ] },
  ],
}

export const topoSort: Pattern = {
  id: 'topo-sort', title: 'Topological Sort', hue: 30,
  short: 'Order tasks with dependencies by repeatedly taking a node with no remaining prerequisites.',
  signals: ['Prerequisites / dependencies / build order', '"Can all tasks be finished?"', 'Detect a cycle in a directed graph', 'Derive an ordering from pairwise rules (alien dictionary)'],
  idea: 'Kahn\'s algorithm: indegree[v] counts v\'s unmet prerequisites. Start with every node whose indegree is 0. Taking a node satisfies one prerequisite of each neighbor, and a neighbor whose count hits 0 becomes available. If some nodes are never taken, they sit on a cycle.',
  templates: [
    {
      name: 'Kahn\'s algorithm',
      code: `from collections import deque

graph = [[] for _ in range(n)]
indegree = [0] * n
for a, b in prerequisites:          # b must come before a
    graph[b].append(a)
    indegree[a] += 1
queue = deque(i for i in range(n) if indegree[i] == 0)
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for nxt in graph[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:
            queue.append(nxt)
has_cycle = len(order) < n`,
      steps: ['Get the edge direction right: "b before a" → edge b → a.', 'The order list is a valid topological order.', 'len(order) < n ⇔ there is a cycle.'],
    },
  ],
  demos: [207],
  complexity: [['Kahn\'s / DFS topo sort', 'O(V + E)', 'O(V + E)', 'each node and edge processed once']],
  tips: [
    'The DFS alternative: post-order, then reverse, with "visiting" state to detect cycles.',
    'Minimum Height Trees: peel leaves layer by layer (Kahn\'s on an undirected graph); the last 1–2 nodes are the answer.',
    'Alien Dictionary: compare adjacent words; the first differing letter gives one edge. Watch the prefix edge case ("abc" before "ab" is invalid).',
  ],
  ds: ['graphs'],
  cs225: 'Graph representations: an adjacency list takes O(n + m) space, ideal for sparse dependency graphs, and an adjacency matrix takes O(n²). Topological order exists exactly when the directed graph is acyclic (a DAG).',
  stages: [
    { title: 'Practice', items: [
      [207, 'Course Schedule', 'M', 'Kahn\'s; return len(order) == n.', 'kahn'],
      [210, 'Course Schedule II', 'M', 'Return the order itself (or [] on a cycle).', 'kahn'],
      [310, 'Minimum Height Trees', 'M', 'Peel leaves until ≤ 2 nodes remain.', 'leaf peeling'],
      [269, 'Alien Dictionary', 'H', 'Edges from adjacent words; Kahn\'s on letters.', 'kahn'],
    ] },
  ],
}

export const unionFind: Pattern = {
  id: 'union-find', title: 'Union-Find (Disjoint Sets)', hue: 250,
  short: 'Maintain groups that only merge: connectivity, components, cycles, in near-O(1) per operation.',
  signals: ['Connections arrive over time ("after each edge…")', 'Count connected components / provinces', 'Adding an edge that creates a cycle', 'Merge accounts / equations into groups', 'Kruskal\'s minimum spanning tree'],
  idea: 'Every set is a tree, and its root is the set\'s representative. find(x) follows parent pointers to the root. union(a, b) links one root under the other. With path compression (point nodes closer to the root while walking) and union by size (attach the smaller tree under the larger), both operations are almost constant time.',
  templates: [
    {
      name: 'Union-find with both optimizations',
      code: `parent = list(range(n))
size = [1] * n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path compression (halving)
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False                    # already connected: this edge closes a cycle
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra                     # union by size
    size[ra] += size[rb]
    return True`,
      steps: ['components = n − (number of successful unions).', 'union() returning False detects a redundant edge.', 'Non-integer items: map them to ids, or use a dict for parent.'],
    },
  ],
  complexity: [
    ['find / union (both optimizations)', 'O(α(n)) amortized', 'O(n)', 'α = inverse Ackermann, ≤ 4 in practice'],
    ['Naive (no optimizations)', 'O(n) worst', 'O(n)', 'trees can become long chains'],
  ],
  tips: [
    'Static graph + a single question → DFS is fine. Edges arriving over time or repeated connectivity queries → union-find.',
    'Accounts Merge: union every email in an account with the account\'s first email.',
    'Satisfiability of Equality Equations: union all "==" first, then check every "!=".',
    'Smallest String With Swaps: union swappable indices, then sort characters within each group.',
  ],
  ds: ['disjoint-sets', 'graphs'],
  cs225: 'Disjoint sets: CS 225 stores "UpTrees" in one array, where a root holds a negative number (its size or height). Smart union + path compression gives O(log* n) amortized per operation, CS 225\'s bound. The tighter bound is α(n).',
  stages: [
    { title: 'Practice', items: [
      [547, 'Number of Provinces', 'M', 'Union every connected pair; count roots.', 'components'],
      [684, 'Redundant Connection', 'M', 'The first edge whose union fails.', 'cycle'],
      [323, 'Number of Connected Components in an Undirected Graph', 'M', 'n − successful unions.', 'components'],
      [990, 'Satisfiability of Equality Equations', 'M', 'Union on "==", then verify "!=".', 'constraints'],
      [1202, 'Smallest String With Swaps', 'M', 'Group indices; sort each group\'s characters.', 'grouping'],
      [721, 'Accounts Merge', 'M', 'Union emails; group by root; sort.', 'grouping'],
    ] },
  ],
}

export const shortestPath: Pattern = {
  id: 'shortest-path', title: 'Weighted Graphs: Shortest Paths & MST', hue: 230,
  short: 'Dijkstra for cheapest paths (BFS with a min-heap); Kruskal / Prim for minimum spanning trees.',
  signals: ['Weighted edges + "minimum cost / time / effort"', 'Network delay, cheapest flight', '"Connect all points with minimum total cost" (MST)', 'All-pairs distances with small n'],
  idea: 'Dijkstra always expands the closest node it hasn\'t finished. With non-negative weights, that node\'s distance is already final. Old heap entries are skipped when popped. For MSTs, Kruskal sorts edges by weight and keeps each edge that union-find says joins two different components, while Prim grows one tree using a heap of crossing edges.',
  templates: [
    {
      name: 'Dijkstra',
      code: `import heapq

dist = {}
heap = [(0, source)]
while heap:
    d, node = heapq.heappop(heap)
    if node in dist:
        continue                  # stale entry: already finalized
    dist[node] = d
    for nxt, w in graph[node]:
        if nxt not in dist:
            heapq.heappush(heap, (d + w, nxt))`,
      steps: ['Build graph[u] = [(v, w), …].', 'Finalize on POP, not on push.', 'Grid problems: the cells are the nodes, and the cost of a move is the edge weight.'],
    },
    {
      name: 'Kruskal (MST)',
      code: `edges.sort()                      # (weight, u, v)
total = used = 0
for w, u, v in edges:
    if union(u, v):               # joins two components (see Union-Find)
        total += w
        used += 1
        if used == n - 1:
            break`,
      steps: ['An MST of n nodes has exactly n − 1 edges.', 'For a dense complete graph (1584), Prim with a heap avoids building all n² edges up front.'],
    },
  ],
  complexity: [
    ['Dijkstra (binary heap)', 'O((V + E) log V)', 'O(V + E)', 'every edge may push once'],
    ['Kruskal', 'O(E log E)', 'O(V + E)', 'sorting the edges dominates'],
    ['Prim (heap)', 'O(E log V)', 'O(V + E)', 'like Dijkstra, but keyed by edge weight'],
    ['Bellman-Ford', 'O(V · E)', 'O(V)', 'handles negative weights; k rounds = at most k edges'],
    ['Floyd–Warshall', 'O(V³)', 'O(V²)', 'all pairs; fine for V ≤ 400'],
  ],
  tips: [
    'Negative edge weights break Dijkstra. Use Bellman-Ford.',
    'Cheapest Flights Within K Stops: Bellman-Ford for k + 1 rounds, copying dist each round (or BFS by levels).',
    'Path With Minimum Effort: Dijkstra where the path cost is the MAX edge so far (or binary search + BFS).',
    'Swim in Rising Water: Dijkstra/heap on max elevation, or union-find by time.',
  ],
  ds: ['graphs', 'heaps', 'disjoint-sets'],
  cs225: 'MST: Kruskal uses disjoint sets and Prim uses a heap. Dijkstra\'s single-source shortest path and Floyd–Warshall all-pairs are both straight out of CS 225.',
  stages: [
    { title: 'Practice', items: [
      [743, 'Network Delay Time', 'M', 'Plain Dijkstra; the answer is the max distance.', 'dijkstra'],
      [1631, 'Path With Minimum Effort', 'M', 'Dijkstra with max() instead of +.', 'dijkstra'],
      [787, 'Cheapest Flights Within K Stops', 'M', 'Bellman-Ford with k + 1 rounds.', 'bellman-ford'],
      [1584, 'Min Cost to Connect All Points', 'M', 'Prim with a heap (dense graph) or Kruskal.', 'MST'],
      [1334, 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', 'M', 'Floyd–Warshall (n ≤ 100).', 'all pairs'],
      [778, 'Swim in Rising Water', 'H', 'Min-heap on the highest elevation so far.', 'dijkstra'],
    ] },
  ],
}
