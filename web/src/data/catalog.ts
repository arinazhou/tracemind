// Category order follows Hello Interview's pattern progression; the problem
// lists merge in Emma Zhang's leetcode-template chapters (BFS / topo sort /
// Dijkstra split, extra sliding-window and binary-search-on-answer problems).

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Problem {
  num: number
  title: string
  slug: string
  difficulty: Difficulty
}

export interface Category {
  id: string
  title: string
  /** Hue (0–360) that tints this category's pastel chips and cards. */
  hue: number
  blurb: string
  problems: Problem[]
}

type Row = [num: number, title: string, difficulty: 'E' | 'M' | 'H', slug?: string]

const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' } as const

const slugify = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

function cat(id: string, title: string, hue: number, blurb: string, rows: Row[]): Category {
  return {
    id, title, hue, blurb,
    problems: rows.map(([num, t, d, slug]) => ({ num, title: t, difficulty: DIFF[d], slug: slug ?? slugify(t) })),
  }
}

export const CATEGORIES: Category[] = [
  cat('two-pointers', 'Two Pointers', 200, 'Sorted input, or pairs from both ends: shrink the search space one pointer at a time.', [
    [1, 'Two Sum', 'E'],
    [167, 'Two Sum II - Input Array Is Sorted', 'M'],
    [11, 'Container With Most Water', 'M'],
    [15, '3Sum', 'M'],
    [611, 'Valid Triangle Number', 'M'],
    [283, 'Move Zeroes', 'E'],
    [75, 'Sort Colors', 'M'],
    [42, 'Trapping Rain Water', 'H'],
  ]),
  cat('sliding-window', 'Sliding Window', 170, 'Contiguous subarray/substring with a condition: grow right, shrink left.', [
    [643, 'Maximum Average Subarray I', 'E'],
    [1423, 'Maximum Points You Can Obtain from Cards', 'M'],
    [2461, 'Maximum Sum of Distinct Subarrays With Length K', 'M'],
    [3, 'Longest Substring Without Repeating Characters', 'M'],
    [424, 'Longest Repeating Character Replacement', 'M'],
    [209, 'Minimum Size Subarray Sum', 'M'],
    [713, 'Subarray Product Less Than K', 'M'],
    [438, 'Find All Anagrams in a String', 'M'],
    [340, 'Longest Substring with At Most K Distinct Characters', 'M'],
    [76, 'Minimum Window Substring', 'H'],
    [239, 'Sliding Window Maximum', 'H'],
  ]),
  cat('binary-search', 'Binary Search', 260, 'Monotonic yes/no boundary, on the array or on the answer itself.', [
    [704, 'Binary Search', 'E'],
    [35, 'Search Insert Position', 'E'],
    [34, 'Find First and Last Position of Element in Sorted Array', 'M'],
    [74, 'Search a 2D Matrix', 'M'],
    [162, 'Find Peak Element', 'M'],
    [153, 'Find Minimum in Rotated Sorted Array', 'M'],
    [33, 'Search in Rotated Sorted Array', 'M'],
    [875, 'Koko Eating Bananas', 'M'],
    [1011, 'Capacity To Ship Packages Within D Days', 'M'],
    [378, 'Kth Smallest Element in a Sorted Matrix', 'M'],
    [410, 'Split Array Largest Sum', 'H'],
  ]),
  cat('prefix-sum', 'Prefix Sum & Hashing', 40, 'Range sums in O(1); "seen this running total before?" with a hash map.', [
    [303, 'Range Sum Query - Immutable', 'E'],
    [560, 'Subarray Sum Equals K', 'M'],
    [525, 'Contiguous Array', 'M'],
    [325, 'Maximum Size Subarray Sum Equals k', 'M'],
  ]),
  cat('cyclic-sort', 'Cyclic Sort & In-place Hashing', 125, 'Values in 1..n: swap each value into slot value−1, then the first misfit is the answer. O(n) time, O(1) space.', [
    [268, 'Missing Number', 'E'],
    [448, 'Find All Numbers Disappeared in an Array', 'E'],
    [442, 'Find All Duplicates in an Array', 'M'],
    [287, 'Find the Duplicate Number', 'M'],
    [41, 'First Missing Positive', 'H'],
  ]),
  cat('intervals', 'Intervals', 20, 'Sort by start (or end), then merge, count overlaps, or sweep.', [
    [252, 'Meeting Rooms', 'E'],
    [253, 'Meeting Rooms II', 'M'],
    [57, 'Insert Interval', 'M'],
    [56, 'Merge Intervals', 'M'],
    [435, 'Non-overlapping Intervals', 'M'],
    [759, 'Employee Free Time', 'H'],
  ]),
  cat('stack', 'Stack & Monotonic Stack', 330, 'Matching pairs, nested structure, and "next greater/smaller" lookups.', [
    [20, 'Valid Parentheses', 'E'],
    [394, 'Decode String', 'M'],
    [32, 'Longest Valid Parentheses', 'H'],
    [496, 'Next Greater Element I', 'E'],
    [503, 'Next Greater Element II', 'M'],
    [739, 'Daily Temperatures', 'M'],
    [84, 'Largest Rectangle in Histogram', 'H'],
  ]),
  cat('linked-list', 'Linked List', 100, 'Fast/slow pointers, dummy heads, and in-place reversal.', [
    [141, 'Linked List Cycle', 'E'],
    [234, 'Palindrome Linked List', 'E'],
    [19, 'Remove Nth Node From End of List', 'M'],
    [143, 'Reorder List', 'M'],
    [24, 'Swap Nodes in Pairs', 'M'],
  ]),
  cat('heap', 'Heap / Priority Queue', 290, 'Top-k, k-way merge, and running medians.', [
    [215, 'Kth Largest Element in an Array', 'M'],
    [973, 'K Closest Points to Origin', 'M'],
    [658, 'Find K Closest Elements', 'M'],
    [692, 'Top K Frequent Words', 'M'],
    [23, 'Merge k Sorted Lists', 'H'],
    [295, 'Find Median from Data Stream', 'H'],
  ]),
  cat('binary-tree', 'Binary Tree & Divide and Conquer', 140, 'Ask what each subtree returns, then combine the answers at the parent. Start with Learn → Trees.', [
    [144, 'Binary Tree Preorder Traversal', 'E'],
    [94, 'Binary Tree Inorder Traversal', 'E'],
    [145, 'Binary Tree Postorder Traversal', 'E'],
    [104, 'Maximum Depth of Binary Tree', 'E'],
    [226, 'Invert Binary Tree', 'E'],
    [100, 'Same Tree', 'E'],
    [101, 'Symmetric Tree', 'E'],
    [112, 'Path Sum', 'E'],
    [110, 'Balanced Binary Tree', 'E'],
    [543, 'Diameter of Binary Tree', 'E'],
    [563, 'Binary Tree Tilt', 'E'],
    [572, 'Subtree of Another Tree', 'E'],
    [700, 'Search in a Binary Search Tree', 'E'],
    [98, 'Validate Binary Search Tree', 'M'],
    [230, 'Kth Smallest Element in a BST', 'M'],
    [235, 'Lowest Common Ancestor of a Binary Search Tree', 'M'],
    [701, 'Insert into a Binary Search Tree', 'M'],
    [1448, 'Count Good Nodes in Binary Tree', 'M'],
    [113, 'Path Sum II', 'M'],
    [437, 'Path Sum III', 'M'],
    [236, 'Lowest Common Ancestor of a Binary Tree', 'M'],
    [687, 'Longest Univalue Path', 'M'],
    [114, 'Flatten Binary Tree to Linked List', 'M'],
    [105, 'Construct Binary Tree from Preorder and Inorder Traversal', 'M'],
    [450, 'Delete Node in a BST', 'M'],
    [124, 'Binary Tree Maximum Path Sum', 'H'],
    [297, 'Serialize and Deserialize Binary Tree', 'H'],
  ]),
  cat('bfs', 'Breadth-First Search', 210, 'Level by level: shortest paths in unweighted graphs, grids, and trees.', [
    [102, 'Binary Tree Level Order Traversal', 'M'],
    [199, 'Binary Tree Right Side View', 'M'],
    [103, 'Binary Tree Zigzag Level Order Traversal', 'M'],
    [662, 'Maximum Width of Binary Tree', 'M'],
    [200, 'Number of Islands', 'M'],
    [994, 'Rotting Oranges', 'M'],
    [542, '01 Matrix', 'M'],
    [286, 'Walls and Gates', 'M'],
    [1091, 'Shortest Path in Binary Matrix', 'M'],
    [1197, 'Minimum Knight Moves', 'M'],
    [127, 'Word Ladder', 'H'],
    [815, 'Bus Routes', 'H'],
  ]),
  cat('topo-sort', 'Topological Sort', 30, 'Dependencies and ordering: peel off nodes whose indegree is 0 (Kahn\'s algorithm).', [
    [207, 'Course Schedule', 'M'],
    [210, 'Course Schedule II', 'M'],
    [310, 'Minimum Height Trees', 'M'],
    [269, 'Alien Dictionary', 'H'],
  ]),
  cat('dfs-backtracking', 'DFS & Backtracking', 350, 'Explore every branch, then undo the choice when the call returns.', [
    [733, 'Flood Fill', 'E'],
    [133, 'Clone Graph', 'M'],
    [261, 'Graph Valid Tree', 'M'],
    [130, 'Surrounded Regions', 'M'],
    [417, 'Pacific Atlantic Water Flow', 'M'],
    [79, 'Word Search', 'M'],
    [78, 'Subsets', 'M'],
    [46, 'Permutations', 'M'],
    [39, 'Combination Sum', 'M'],
    [22, 'Generate Parentheses', 'M'],
    [131, 'Palindrome Partitioning', 'M'],
    [51, 'N-Queens', 'H'],
  ]),
  cat('shortest-path', 'Shortest Paths (Dijkstra)', 230, 'Weighted edges: BFS plus a min-heap keyed by distance.', [
    [743, 'Network Delay Time', 'M'],
    [787, 'Cheapest Flights Within K Stops', 'M'],
    [1631, 'Path With Minimum Effort', 'M'],
    [1334, 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', 'M'],
  ]),
  cat('dp', 'Dynamic Programming', 60, 'Overlapping subproblems: define the state, then the transition.', [
    [338, 'Counting Bits', 'E'],
    [62, 'Unique Paths', 'M'],
    [64, 'Minimum Path Sum', 'M'],
    [91, 'Decode Ways', 'M'],
    [322, 'Coin Change', 'M'],
    [221, 'Maximal Square', 'M'],
    [300, 'Longest Increasing Subsequence', 'M'],
    [139, 'Word Break', 'M'],
    [256, 'Paint House', 'M'],
    [265, 'Paint House II', 'H'],
    [1235, 'Maximum Profit in Job Scheduling', 'H'],
  ]),
  cat('greedy', 'Greedy', 80, 'The locally best choice is provably globally safe.', [
    [121, 'Best Time to Buy and Sell Stock', 'E'],
    [55, 'Jump Game', 'M'],
    [45, 'Jump Game II', 'M'],
    [134, 'Gas Station', 'M'],
    [763, 'Partition Labels', 'M'],
  ]),
  cat('trie', 'Trie', 185, 'Prefix trees for word lookups and prefix matching.', [
    [208, 'Implement Trie (Prefix Tree)', 'M'],
    [211, 'Design Add and Search Words Data Structure', 'M'],
    [212, 'Word Search II', 'H'],
  ]),
  cat('matrices', 'Matrices', 310, 'Index gymnastics: layers, transposes, and in-place markers.', [
    [54, 'Spiral Matrix', 'M'],
    [48, 'Rotate Image', 'M'],
    [73, 'Set Matrix Zeroes', 'M'],
  ]),
]

export const PROBLEMS = new Map<number, { problem: Problem; category: Category }>()
for (const c of CATEGORIES) for (const p of c.problems) PROBLEMS.set(p.num, { problem: p, category: c })

export const leetcodeUrl = (p: Problem) => `https://leetcode.com/problems/${p.slug}/`
