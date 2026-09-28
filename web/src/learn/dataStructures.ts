// Data structure reference pages, following UIUC CS 225's lectures (Spring 2026
// annotated notes + slides, linked on each page) but in Python. Short on purpose: the interview
// patterns are the main track; these explain the machinery underneath.
import type { DataStructure } from './types'

export const CS225_SLIDES = 'https://courses.grainger.illinois.edu/cs225/sp2026/assets/lectures/slides/'
export const CS225_LECTURES_PAGE = 'https://courses.grainger.illinois.edu/cs225/sp2026/pages/lectures.html'

/** Blank slides and the annotated version written on during lecture. */
export const slideUrls = (stem: string) => ({ blank: `${CS225_SLIDES}${stem}.pdf`, annotated: `${CS225_SLIDES}${stem}-annotated.pdf` })

export const DATA_STRUCTURES: DataStructure[] = [
  {
    id: 'arrays', title: 'Arrays & Dynamic Arrays', hue: 200,
    short: 'Contiguous memory with O(1) indexing. Python\'s list is CS 225\'s "array list".',
    what: 'An array stores elements side by side, so element i lives at start + i × size: O(1) access by index. A dynamic array (Python list, C++ std::vector) keeps spare capacity. When it fills up, it allocates a bigger block and copies everything over.',
    python: `nums = [3, 1, 4]
nums.append(1)          # O(1) amortized
nums.pop()              # O(1): remove from the end
nums.insert(0, 9)       # O(n): shifts everything right
nums.pop(0)             # O(n): shifts everything left (use deque instead)
x in nums               # O(n) linear scan

import bisect
bisect.bisect_left(sorted_nums, 5)   # O(log n) on sorted data

grid = [[0] * cols for _ in range(rows)]   # correct 2-D init
bad = [[0] * cols] * rows                  # rows are the SAME list object!
"".join(parts)          # O(total length); s += piece in a loop can be O(n²)`,
    ops: [
      ['Access / assign by index', 'O(1)', 'address arithmetic'],
      ['Append / pop at the end', 'O(1) amortized', 'occasional resize is O(n)'],
      ['Insert / delete in the middle', 'O(n)', 'shift elements'],
      ['Search (unsorted / sorted)', 'O(n) / O(log n)', 'scan / binary search'],
      ['Slice a[i:j]', 'O(j − i)', 'it copies'],
    ],
    ideas: [
      'Amortized analysis: growing by a constant k costs O(n) per append on average, while DOUBLING the capacity makes each append O(1) amortized, because the total copying is 1 + 2 + 4 + … + n < 2n.',
      'Contiguous memory is cache-friendly, which is why arrays usually beat linked lists in practice even at equal Big-O.',
      'Python strings are immutable arrays, so build them with a list and "".join.',
    ],
    lectures: [['Array Lists (and amortized resizing)', 'cs225sp26-06-array-slides'], ['List ADT', 'cs225sp26-03-listadt-slides']],
    patterns: ['two-pointers', 'sliding-window', 'prefix-sum', 'binary-search', 'cyclic-sort', 'matrices'],
  },
  {
    id: 'linked-lists', title: 'Linked Lists', hue: 100,
    short: 'Nodes joined by pointers: O(1) insert/remove at a known spot, O(n) to find anything.',
    what: 'Each node holds a value and a pointer to the next node (and the previous one, in a doubly linked list). There is no index arithmetic, so reaching the k-th node means walking k steps. In exchange, splicing a node in or out is O(1) once you hold a pointer to it.',
    python: `class ListNode:                    # what LeetCode gives you
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# walk
node = head
while node:
    node = node.next

# collections.deque is a doubly linked list of blocks:
from collections import deque
q = deque([1, 2, 3])
q.appendleft(0); q.popleft()      # O(1) at both ends`,
    ops: [
      ['Access k-th node', 'O(k)', 'must walk'],
      ['Insert / remove after a known node', 'O(1)', 'rewire pointers'],
      ['Insert at head', 'O(1)', ''],
      ['Remove a given node (doubly linked)', 'O(1)', 'this is what LRU caches rely on'],
      ['Search by value', 'O(n)', ''],
    ],
    ideas: [
      'CS 225 builds the List ADT two ways, as linked memory and as an array list, and compares their costs. Know that table cold for interviews.',
      'Sentinel (dummy) nodes remove the empty-list and head special cases. That\'s the "dummy head" trick in the Linked List lesson.',
      'Doubly linked list + hash map = O(1) LRU cache.',
    ],
    lectures: [['List ADT', 'cs225sp26-03-listadt-slides'], ['Linked Lists', 'cs225sp26-04-linked2-slides'], ['Linked Lists (continued)', 'cs225sp26-05-linked3-slides']],
    patterns: ['linked-list', 'hashing'],
  },
  {
    id: 'stacks-queues', title: 'Stacks & Queues', hue: 330,
    short: 'LIFO and FIFO access: the containers behind DFS, BFS, and monotonic tricks.',
    what: 'A stack returns the most recently added item first (LIFO); a queue returns the oldest first (FIFO). Both are ADTs, meaning a promise about behavior, usually implemented on top of an array list or a linked list.',
    python: `stack = []
stack.append(1); stack.append(2)
stack.pop()            # 2: O(1)
stack[-1]              # peek

from collections import deque
queue = deque()
queue.append(1); queue.append(2)
queue.popleft()        # 1: O(1). Never use list.pop(0) for a queue!

# monotonic deque (sliding window maximum):
# keep indices whose values are decreasing; pop from the front when out of the window`,
    ops: [
      ['push / pop (stack)', 'O(1) amortized', 'list end'],
      ['enqueue / dequeue (deque)', 'O(1)', 'both ends'],
      ['peek', 'O(1)', ''],
      ['list.pop(0)', 'O(n)', 'shifts every element: a classic hidden O(n²)'],
    ],
    ideas: [
      'CS 225 implements a queue on an array as a circular buffer (head and tail indices wrapping around), so both ends are O(1).',
      'Recursion uses the call stack, so any recursive DFS can be rewritten with an explicit stack (useful for Python\'s recursion limit).',
      'A priority queue is NOT a queue in this sense. It is a heap (see Heaps).',
    ],
    lectures: [['Stacks & Queues', 'cs225sp26-07-quacks-slides']],
    patterns: ['stack', 'bfs', 'sliding-window', 'dfs'],
  },
  {
    id: 'trees', title: 'Trees & BSTs', hue: 140, custom: true,
    short: 'The full interactive lesson: vocabulary, traversals, 4 templates, BSTs, Big-O.',
    what: '', python: '', ops: [], ideas: [],
    lectures: [['Tree Intro', 'cs225sp26-09-treeintro'], ['Tree Traversal', 'cs225sp26-10-treetraversal'], ['Tree Search', 'cs225sp26-11-treesearch'], ['BST', 'cs225sp26-12-bst'], ['BST Implementation', 'cs225sp26-13-bstimplementation']],
    patterns: ['dfs', 'bfs', 'backtracking'],
  },
  {
    id: 'balanced-trees', title: 'Balanced Trees: AVL, B-Trees, k-d Trees', hue: 160,
    short: 'Keeping a BST short so every operation stays O(log n).',
    what: 'A BST\'s operations cost O(h), and inserting sorted data makes h = n. Balanced trees fix the height. AVL trees rebalance with rotations after each insert or remove. B-trees store many keys per node so the tree is very shallow (built for disks and databases). k-d trees split space by alternating dimensions to answer range and nearest-neighbor queries.',
    python: `# Python has no built-in balanced BST. In interviews:
import bisect
arr = []
bisect.insort(arr, 5)          # O(n) insert, but O(log n) search

# LeetCode ships sortedcontainers (a B-tree-like structure):
from sortedcontainers import SortedList
s = SortedList([5, 1, 3])
s.add(4)                       # O(log n)
s.bisect_left(3)               # rank queries
s[0], s[-1]                    # min, max`,
    ops: [
      ['AVL search / insert / remove', 'O(log n)', 'height ≤ ~1.44 log₂ n'],
      ['Rotation', 'O(1)', 'a few pointer changes'],
      ['B-tree (order m) search', 'O(log_m n) node reads', 'each node holds up to m − 1 keys'],
      ['k-d tree nearest neighbor', 'O(log n) average', 'can degrade in bad cases'],
    ],
    ideas: [
      'AVL invariant: at every node, |height(left) − height(right)| ≤ 1. An insert can break it along one path, and one single or double rotation (LL, RR, LR, RL cases) fixes it.',
      'You won\'t implement AVL in an interview, but "a balanced BST (TreeMap / SortedList) gives O(log n)" is a common answer to "how would you keep this sorted under updates?"',
      'B-trees trade CPU work for fewer disk reads, which is why databases and filesystems use them.',
    ],
    lectures: [['AVL Trees: Intro', 'cs225sp26-16-avltrees-intro'], ['AVL Trees: Implementation', 'cs225sp26-17-avltrees-implementation'], ['AVL Trees: Analysis', 'cs225sp26-18-avltrees-analysis'], ['k-d Trees', 'cs225sp26-14-kdtrees'], ['B-Tree Intro', 'cs225sp26-19-btreeintroduction'], ['B-Tree Analysis', 'cs225sp26-20-btreeanalysis-slides']],
    patterns: ['binary-search', 'dfs'],
  },
  {
    id: 'heaps', title: 'Heaps & Priority Queues', hue: 290,
    short: 'A complete binary tree in an array: min in O(1), insert and remove-min in O(log n).',
    what: 'A (min-)heap keeps every parent ≤ its children, so the minimum is at the root. Because the tree is complete (filled level by level), it fits in a plain array with no pointers: the children of index i are at fixed positions.',
    python: `import heapq
h = []
heapq.heappush(h, 5)
heapq.heappush(h, 1)
heapq.heappop(h)        # 1: smallest first
h[0]                    # peek min

heapq.heapify(nums)     # O(n), in place
heapq.heappush(h, -x)   # max-heap trick: store negatives
heapq.heappush(h, (priority, tiebreak, item))
heapq.nlargest(3, nums)`,
    ops: [
      ['peek min', 'O(1)', 'root'],
      ['insert (heapifyUp)', 'O(log n)', 'swap up one path'],
      ['remove min (heapifyDown)', 'O(log n)', 'move last to root, sift down'],
      ['buildHeap / heapify', 'O(n)', 'not O(n log n)!'],
      ['heap sort', 'O(n log n)', 'n removals'],
    ],
    ideas: [
      'Index math. CS 225 is 1-indexed: children 2i and 2i + 1, parent ⌊i/2⌋. Python\'s heapq is 0-indexed: children 2i + 1 and 2i + 2, parent (i − 1) // 2.',
      'buildHeap is O(n) because it heapifies DOWN from the last internal node. Most nodes sit near the bottom and move only a little.',
      'Heaps are how CS 225 implements the priority queue ADT behind Dijkstra and Prim.',
    ],
    lectures: [['Heaps', 'cs225sp26-21-heaps-slides'], ['Heap Analysis (buildHeap is O(n))', 'cs225sp26-22-heapsanalysis-slides']],
    patterns: ['heap', 'intervals', 'shortest-path', 'greedy'],
  },
  {
    id: 'hashing', title: 'Hash Tables', hue: 40,
    short: 'Key → bucket in O(1) on average, which powers dict, set, Counter, and memoization.',
    what: 'A hash function turns a key into an index into an array of buckets. Two keys can land in the same bucket (a collision), so the table needs a collision strategy. It resizes when it gets too full to keep operations fast.',
    python: `seen = set()
counts = {}
counts[x] = counts.get(x, 0) + 1

from collections import Counter, defaultdict
Counter("banana")              # {'a': 3, 'n': 2, 'b': 1}
groups = defaultdict(list)

# keys must be hashable (immutable):
d[(r, c)] = 1                  # tuple key: fine
d[[r, c]] = 1                  # TypeError: list is unhashable
d[frozenset(s)] = 1`,
    ops: [
      ['insert / find / remove', 'O(1) average', 'O(n) worst case (every key collides)'],
      ['resize (rehash)', 'O(n)', 'rare, so amortized O(1) per insert'],
      ['iterate', 'O(n + capacity)', ''],
    ],
    ideas: [
      'Separate chaining: each bucket is a list, and the expected chain length is the load factor α = n / m.',
      'Open addressing (what Python uses): on a collision, probe other slots. Linear probing clusters; double hashing spreads keys out.',
      'CS 225\'s analysis assumes SUHA (simple uniform hashing). Keeping α bounded by resizing gives O(1) expected time per operation.',
      'Bloom filters answer "maybe in the set / definitely not" in tiny space. Worth one sentence in a system-design chat.',
    ],
    lectures: [['Hashing', 'cs225sp26-35-hashing-slides'], ['Hashing 2', 'cs225sp26-36-hashing2-slides'], ['Hashing 3', 'cs225sp26-37-hashing3-slides'], ['Bloom Filters', 'cs225sp26-38-bloom-slides']],
    patterns: ['hashing', 'prefix-sum', 'sliding-window', 'dp'],
  },
  {
    id: 'disjoint-sets', title: 'Disjoint Sets', hue: 250,
    short: 'Groups that only merge: CS 225\'s "UpTrees" with smart union and path compression.',
    what: 'Disjoint sets keep elements partitioned into groups with two operations: find (which group?) and union (merge two groups). Each group is a tree stored in one array, where every element points to its parent and the root identifies the set.',
    python: `parent = list(range(n))
def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])    # path compression
    return parent[x]
def union(a, b):
    parent[find(a)] = find(b)          # add union by size for the full guarantee

# CS 225 variant: one array, roots store -size
up = [-1] * n`,
    ops: [
      ['find / union (naive)', 'O(n) worst', 'trees can become chains'],
      ['with union by size/height', 'O(log n)', 'height stays logarithmic'],
      ['+ path compression', 'O(log* n) amortized', 'α(n) is the tighter bound; effectively constant'],
    ],
    ideas: [
      'Smart union: attach the smaller (or shorter) tree under the larger, so height grows only when sizes double.',
      'Path compression: while finding the root, point visited nodes directly at it.',
      'Used for Kruskal\'s MST, connected components under edge insertions, and grouping (accounts, equations).',
    ],
    lectures: [['Disjoint Sets', 'cs225sp26-24-sets-slides'], ['Disjoint Sets: Analysis', 'cs225sp26-25-sets2-slides']],
    patterns: ['union-find', 'shortest-path'],
  },
  {
    id: 'graphs', title: 'Graphs', hue: 230,
    short: 'Vertices + edges: representations, traversals, MST, and shortest paths.',
    what: 'A graph is a set of vertices joined by edges, which may be directed or undirected, weighted or unweighted. Trees, grids, dependency lists, and state spaces (lock combinations, word ladders) are all graphs in disguise. First choose a representation, then a traversal.',
    python: `from collections import defaultdict

edges = [(0, 1), (1, 2), (2, 0)]
graph = defaultdict(list)          # adjacency list: O(V + E) space
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)             # omit for a directed graph

matrix = [[0] * n for _ in range(n)]   # adjacency matrix: O(V²) space
for u, v in edges:
    matrix[u][v] = matrix[v][u] = 1

# weighted: graph[u].append((v, w))
# grid: neighbors are (r ± 1, c) and (r, c ± 1)`,
    ops: [
      ['Adjacency list: space / neighbors of v', 'O(V + E) / O(deg v)', 'best for sparse graphs (most interview graphs)'],
      ['Adjacency matrix: space / is (u, v) an edge?', 'O(V²) / O(1)', 'best for dense graphs'],
      ['BFS / DFS', 'O(V + E)', 'with an adjacency list'],
      ['Dijkstra (heap)', 'O((V + E) log V)', 'non-negative weights'],
      ['Kruskal / Prim', 'O(E log E) / O(E log V)', 'minimum spanning tree'],
      ['Floyd–Warshall', 'O(V³)', 'all pairs'],
    ],
    ideas: [
      'Vocabulary: degree, path, cycle, connected component, DAG (directed acyclic graph), and a spanning tree has V − 1 edges.',
      'BFS finds fewest-edge paths; DFS finds structure (back edges = cycles, topological order).',
      'CS 225 compares edge list, adjacency matrix, and adjacency list implementations. The trade-off table above is a common interview discussion.',
    ],
    lectures: [['Graphs', 'cs225sp26-26-graph-slides'], ['Graph Implementations', 'cs225sp26-27-graph2-slides'], ['Graph Traversals (BFS / DFS)', 'cs225sp26-29-bfsdfs-slides'], ['MST', 'cs225sp26-30-mst-slides'], ['MST 2', 'cs225sp26-31-mst2-slides'], ['Shortest Paths (Dijkstra)', 'cs225sp26-32-sssp-slides'], ['All-Pairs Shortest Paths', 'cs225sp26-33-allpaths-slides']],
    patterns: ['dfs', 'bfs', 'topo-sort', 'union-find', 'shortest-path'],
  },
]
