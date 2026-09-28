import type { Pattern } from '../types'

export const dp: Pattern = {
  id: 'dp', title: 'Dynamic Programming', hue: 60,
  short: 'Solve each overlapping subproblem once: define the state, the transition, and the base case.',
  signals: [
    '"Number of ways", "minimum/maximum cost", "can you make / reach"',
    'Choices at each step, where the future depends only on a small state (index, remaining amount)',
    'A brute-force recursion that calls itself with the same arguments again and again',
  ],
  idea: 'Start from a brute-force recursion, then cache it (@cache) and you have top-down DP. Or fill a table in dependency order and you have bottom-up DP. The real work is choosing the state: the smallest set of facts that determines the answer for the rest of the problem. Say the recurrence in words before coding it.',
  templates: [
    {
      name: 'Top-down (memoized recursion)',
      code: `from functools import cache

@cache
def solve(i):                    # answer for the suffix starting at i
    if i >= n:
        return BASE
    take = VALUE(i) + solve(i + 2)
    skip = solve(i + 1)
    return max(take, skip)

return solve(0)`,
      steps: ['Write the brute force as a function of the state.', 'Add @cache: now each state is computed once.', 'Complexity = number of states × work per state.'],
    },
    {
      name: 'Bottom-up table',
      code: `dp = [BASE] * (n + 1)            # dp[i] = answer for the first i items
dp[0] = START
for i in range(1, n + 1):
    for choice in CHOICES:
        if FITS(i, choice):
            dp[i] = BEST(dp[i], dp[i - COST(choice)] + GAIN(choice))
return dp[n]`,
      steps: ['Fill in an order where dependencies are already computed.', 'If dp[i] only needs the previous one or two entries, keep just those: O(1) space.', '0/1 knapsack in 1-D: iterate the capacity BACKWARDS so each item is used once.'],
    },
  ],
  complexity: [
    ['1-D DP (stairs, robber)', 'O(n)', 'O(n) → O(1)', 'n states × O(1) choices'],
    ['Coin change / knapsack', 'O(n · m)', 'O(n)', 'amount × number of coins'],
    ['2-D DP (LCS, edit distance, grid)', 'O(m · n)', 'O(m · n) → O(n)', 'one row at a time is enough'],
    ['LIS', 'O(n²) → O(n log n)', 'O(n)', 'patience sorting with bisect'],
  ],
  tips: [
    'Name the dp array in words: "dp[a] = fewest coins that make amount a".',
    '1-D: Climbing Stairs, House Robber, Coin Change, Word Break, LIS. 2-D: Unique Paths, LCS, Edit Distance.',
    'House Robber II (circle): run House Robber twice, without the first house and without the last.',
    'Partition Equal Subset Sum = can some subset reach sum / 2 (0/1 knapsack with booleans).',
    'Longest Palindromic Substring: expand around each center is O(n²) and simpler than a table.',
    'If greedy fails on a small example, DP is usually the fix.',
  ],
  ds: ['arrays', 'hashing'],
  cs225: 'Memoization is a hash table from state to answer, which is exactly what @cache builds.',
  stages: [
    { title: '1-D warm up', items: [
      [70, 'Climbing Stairs', 'E', 'dp[i] = dp[i − 1] + dp[i − 2].', '1-D'],
      [746, 'Min Cost Climbing Stairs', 'E', 'dp[i] = cost[i] + min(dp[i − 1], dp[i − 2]).', '1-D'],
      [338, 'Counting Bits', 'E', 'bits[i] = bits[i >> 1] + (i & 1).', '1-D'],
      [198, 'House Robber', 'M', 'max(skip, take + two back).', '1-D'],
      [213, 'House Robber II', 'M', 'Robber on [1:] and [:-1].', '1-D'],
    ] },
    { title: 'Choices & strings', items: [
      [322, 'Coin Change', 'M', 'dp[a] = min over coins of dp[a − c] + 1.', 'unbounded knapsack'],
      [518, 'Coin Change II', 'M', 'Loop coins OUTSIDE amounts to count combinations, not permutations.', 'unbounded knapsack'],
      [91, 'Decode Ways', 'M', 'Take one digit (if not 0) or two (10..26).', '1-D'],
      [139, 'Word Break', 'M', 'dp[i] = any(dp[j] and s[j:i] in words).', '1-D'],
      [300, 'Longest Increasing Subsequence', 'M', 'O(n²) dp, or tails + bisect for O(n log n).', '1-D'],
      [416, 'Partition Equal Subset Sum', 'M', 'Boolean knapsack to sum / 2, capacity backwards.', '0/1 knapsack'],
      [5, 'Longest Palindromic Substring', 'M', 'Expand around 2n − 1 centers.', 'expand'],
    ] },
    { title: '2-D', items: [
      [62, 'Unique Paths', 'M', 'dp[r][c] = dp[r − 1][c] + dp[r][c − 1].', 'grid'],
      [64, 'Minimum Path Sum', 'M', 'Same shape with min().', 'grid'],
      [221, 'Maximal Square', 'M', '1 + min(up, left, up-left).', 'grid'],
      [1143, 'Longest Common Subsequence', 'M', 'Match → diagonal + 1; else max(up, left).', 'two strings'],
      [72, 'Edit Distance', 'M', '1 + min(insert, delete, replace), or the diagonal on a match.', 'two strings'],
      [256, 'Paint House', 'M', 'dp[i][color] = cost + min of the other colors at i − 1.', 'states'],
    ] },
    { title: 'Stretch', items: [
      [265, 'Paint House II', 'H', 'Track the smallest and second-smallest of the previous row.', 'states'],
      [1235, 'Maximum Profit in Job Scheduling', 'H', 'Sort by end; dp + bisect for the last compatible job.', 'dp + binary search'],
    ] },
  ],
}

export const greedy: Pattern = {
  id: 'greedy', title: 'Greedy', hue: 80,
  short: 'Take the locally best choice at every step, when you can argue it never hurts.',
  signals: ['"Minimum number of jumps / arrows / intervals" to cover something', 'Buy/sell with a running best', 'A circular route (gas station)', 'Partition by last occurrence'],
  idea: 'Greedy works when an exchange argument holds: any optimal solution can be rewritten to include your greedy choice without getting worse. Before trusting a greedy rule, try to break it with a tiny counterexample. If you can, you probably need DP.',
  templates: [
    {
      name: 'Running best',
      code: `best = 0
low = float("inf")
for price in prices:
    low = min(low, price)             # best buy so far
    best = max(best, price - low)     # best sell today`,
      steps: ['Keep the best "state so far" in one or two variables.', 'Update the answer as if today were the last day.'],
    },
    {
      name: 'Farthest reach',
      code: `reach = 0
for i, jump in enumerate(nums):
    if i > reach:
        return False                  # we can never get here
    reach = max(reach, i + jump)
return True`,
      steps: ['Track the farthest index reachable so far.', 'Jump Game II: count a jump each time i passes the end of the current range.'],
    },
  ],
  complexity: [['Single pass', 'O(n)', 'O(1)', 'one scan'], ['Sort first', 'O(n log n)', 'O(n)', 'sorting dominates']],
  tips: [
    'Gas Station: if total gas ≥ total cost a start exists; restart the start after any index where the tank goes negative.',
    'Partition Labels: record each letter\'s last index; cut when i reaches the max last index seen.',
    'Hand of Straights: Counter + always start runs at the smallest remaining card.',
    'Interval greedy (sort by end) lives in the Intervals lesson.',
  ],
  ds: ['arrays', 'heaps'],
  stages: [
    { title: 'Practice', items: [
      [121, 'Best Time to Buy and Sell Stock', 'E', 'Running minimum.', 'running best'],
      [55, 'Jump Game', 'M', 'Farthest reach.', 'reach'],
      [45, 'Jump Game II', 'M', 'BFS-like ranges: jumps++ when i passes the current end.', 'reach'],
      [134, 'Gas Station', 'M', 'Reset the start when the tank drops below 0.', 'running best'],
      [763, 'Partition Labels', 'M', 'Last occurrence map; cut at the running max.', 'reach'],
      [846, 'Hand of Straights', 'M', 'Counter; start each group at the smallest card.', 'sort'],
    ] },
  ],
}
