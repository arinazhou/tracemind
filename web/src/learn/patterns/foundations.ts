import type { Pattern } from '../types'

export const hashing: Pattern = {
  id: 'hashing', title: 'Hash Maps & Sets', hue: 40,
  short: 'Trade memory for O(1) lookups: "have I seen this?", counting, and grouping.',
  signals: [
    'You need a partner/complement for each element (pair sums, differences)',
    'Counting frequencies, or comparing two collections\' contents',
    'Grouping items by some key (anagrams, same pattern)',
    'A brute force that compares every pair: O(n²)',
  ],
  idea: 'A dict or set gives average O(1) insert and lookup. Almost every "hash map" solution replaces an inner loop that searches with a lookup into something you built on an earlier pass, or earlier in the same pass. Keys must be hashable: ints, strings, tuples, frozensets (not lists).',
  templates: [
    {
      name: 'Seen-so-far lookup',
      code: `seen = {}                        # key -> info (index, count, ...)
for i, x in enumerate(nums):
    if COMPLEMENT(x) in seen:    # its partner appeared earlier
        return [seen[COMPLEMENT(x)], i]
    seen[x] = i                  # record AFTER checking`,
      steps: ['Decide what you look up for each x (target − x, x − k, a key…).', 'Check first, then insert, so an element never pairs with itself.', 'Store whatever the answer needs: an index, a count, a first position.'],
    },
    {
      name: 'Count / group by key',
      code: `from collections import Counter, defaultdict

counts = Counter(items)                 # item -> frequency
groups = defaultdict(list)
for item in items:
    groups[KEY(item)].append(item)      # e.g. KEY = tuple(sorted(word))`,
      steps: ['Pick a key that is identical for items that belong together.', 'Counter handles frequencies, and two Counters compare with ==.', 'Return the grouped values: list(groups.values()).'],
    },
  ],
  complexity: [
    ['Build a dict/set of n items', 'O(n)', 'O(n)', 'n inserts at O(1) average'],
    ['Lookup / insert / delete', 'O(1) avg', '—', 'O(n) worst case if everything collides (CS 225)'],
    ['Group n words of length k by sorted key', 'O(n · k log k)', 'O(n · k)', 'sorting each word; a 26-count tuple key makes it O(n · k)'],
  ],
  tips: [
    'Check before insert (Two Sum), or an element can match itself.',
    'Counter supports ==, most_common(k), subtraction, and missing keys default to 0.',
    'Anagram keys: tuple(sorted(w)) is simplest; a tuple of 26 counts avoids the sort.',
    'Use a set when you only need membership, and a dict when you need extra info.',
    'Say "O(1) on average". Interviewers like hearing that you know the worst case.',
    'Longest Consecutive Sequence: only start counting from x when x − 1 is not in the set. That keeps it O(n).',
  ],
  ds: ['hashing', 'arrays'],
  cs225: 'Hash tables: a hash function maps keys to buckets, and collisions are handled by separate chaining or open addressing (linear probing, double hashing). Keeping the load factor α = n/m bounded, by resizing, keeps operations O(1) on average under the simple uniform hashing assumption. Python\'s dict uses open addressing.',
  stages: [
    { title: 'Warm up', items: [
      [217, 'Contains Duplicate', 'E', 'Add to a set; if it is already there, return True.', 'set'],
      [242, 'Valid Anagram', 'E', 'Counter(s) == Counter(t).', 'count'],
      [1, 'Two Sum', 'E', 'Look up target − x before inserting x.', 'seen-so-far'],
      [205, 'Isomorphic Strings', 'E', 'Two dicts: s→t and t→s. Both mappings must stay consistent.', 'map'],
      [290, 'Word Pattern', 'E', 'Same as Isomorphic Strings with words instead of characters.', 'map'],
      [170, 'Two Sum III - Data structure design', 'E', 'Store counts. For each x, check target − x, careful when they are equal.', 'count'],
    ] },
    { title: 'Mediums', items: [
      [49, 'Group Anagrams', 'M', 'Key = tuple(sorted(word)); group with defaultdict(list).', 'group'],
      [128, 'Longest Consecutive Sequence', 'M', 'Set of nums; only start a run at x if x − 1 is missing.', 'set'],
      [36, 'Valid Sudoku', 'M', 'Sets for each row, column and box (r // 3, c // 3).', 'set'],
      [380, 'Insert Delete GetRandom O(1)', 'M', 'List + dict value → index. Delete by swapping with the last element.', 'design'],
      [454, '4Sum II', 'M', 'Count all a + b in a Counter, then look up −(c + d).', 'count'],
    ] },
  ],
}

export const twoPointers: Pattern = {
  id: 'two-pointers', title: 'Two Pointers', hue: 200,
  short: 'Two indices walking an array, from both ends or one chasing the other: O(n) instead of O(n²).',
  signals: [
    'Sorted array + find a pair/triplet with a target sum',
    'Palindromes, or comparing from both ends',
    'Rearranging in place: move zeroes, remove duplicates, partition (sort colors)',
    '"Container"/"trap water" problems with heights on both sides',
  ],
  idea: 'Every move discards an index that provably can\'t be part of the answer, so the pointers cross the array once. There are two flavors: converging pointers from opposite ends (usually needs sorted input), and read/write pointers moving the same direction for in-place edits.',
  templates: [
    {
      name: 'Converging (opposite ends)',
      code: `left, right = 0, len(nums) - 1
while left < right:
    s = nums[left] + nums[right]
    if s == target:
        return [left, right]
    if s < target:
        left += 1        # need bigger: only moving left can help
    else:
        right -= 1       # need smaller`,
      steps: ['Sort first if the input isn\'t sorted and indices don\'t matter.', 'Write down WHY a move is safe ("nums[left] can\'t pair with anything left of right").', 'Stop when the pointers meet.'],
    },
    {
      name: 'Read / write (same direction)',
      code: `write = 0
for read in range(len(nums)):
    if KEEP(nums[read]):
        nums[write] = nums[read]
        write += 1
# nums[:write] holds the kept items, in their original order`,
      steps: ['read scans everything; write marks where the next kept item goes.', 'Anything before write is final.', 'Fill the tail afterwards if the problem asks (e.g. zeros).'],
    },
  ],
  demos: [11],
  complexity: [
    ['Converging or read/write pass', 'O(n)', 'O(1)', 'each pointer moves at most n times'],
    ['Sort first', '+ O(n log n)', 'O(1)–O(n)', 'Python\'s sort (Timsort) uses up to O(n) space'],
    ['3Sum: fix i, two-pointer the rest', 'O(n²)', 'O(1)', 'n starting points × O(n) scan'],
  ],
  tips: [
    '3Sum: sort, fix i, two-pointer on i+1..end. Skip duplicate values at i and right after a match.',
    'Container / Trapping Rain Water: always move the side with the SMALLER height.',
    'Sort Colors (Dutch flag): three pointers, low / mid / high. Don\'t advance mid after swapping with high.',
    'Valid Palindrome: skip non-alphanumerics with inner while loops and compare lowercase.',
    'If you can\'t justify a move with "this index can never be in the answer", two pointers probably isn\'t the tool.',
  ],
  ds: ['arrays'],
  cs225: 'Array lists give O(1) access by index, which is what makes jumping pointers free. The same trick on a linked list needs fast/slow pointers instead.',
  stages: [
    { title: 'Warm up', items: [
      [125, 'Valid Palindrome', 'E', 'Converge, skipping non-alphanumeric characters.', 'converging'],
      [283, 'Move Zeroes', 'E', 'Read/write: copy non-zeros forward, then fill zeros.', 'read/write'],
      [167, 'Two Sum II - Input Array Is Sorted', 'M', 'The converging template, exactly.', 'converging'],
    ] },
    { title: 'Mediums', items: [
      [11, 'Container With Most Water', 'M', 'Area uses the shorter wall; move that side inward.', 'converging'],
      [15, '3Sum', 'M', 'Sort; for each i, two-pointer the rest; skip duplicates.', 'sort + converging'],
      [611, 'Valid Triangle Number', 'M', 'Sort; fix the largest side c; if a + b > c, all pairs between count.', 'sort + converging'],
      [75, 'Sort Colors', 'M', 'low/mid/high pointers; 0 → swap low, 2 → swap high.', 'three pointers'],
    ] },
    { title: 'Stretch', items: [
      [42, 'Trapping Rain Water', 'H', 'Track left_max and right_max; process the side with the smaller max.', 'converging'],
    ] },
  ],
}

export const slidingWindow: Pattern = {
  id: 'sliding-window', title: 'Sliding Window', hue: 170,
  short: 'Keep a contiguous window [left, right] and update it incrementally instead of recomputing.',
  signals: [
    '"Subarray" or "substring" + longest / shortest / max / count',
    'A fixed window size k',
    'A condition that stays broken if you grow the window (sum ≥ target with positives, too many distinct chars)',
  ],
  idea: 'Grow the window by moving right one step at a time. When it breaks the rule, shrink from the left until it\'s valid again. Every index enters once and leaves once, so the whole thing is O(n) even though there\'s a loop inside a loop. Fixed-size windows simply add one element and drop one per step.',
  templates: [
    {
      name: 'Fixed size k',
      code: `window = sum(nums[:k])
best = window
for right in range(k, len(nums)):
    window += nums[right] - nums[right - k]   # add new, drop old
    best = max(best, window)`,
      steps: ['Build the first window.', 'Each step: add nums[right], remove nums[right − k].', 'Update the answer after every slide.'],
    },
    {
      name: 'Variable size (longest valid)',
      code: `left = 0
best = 0
for right, x in enumerate(s):
    ADD(x)                          # grow
    while INVALID():                # shrink until valid again
        REMOVE(s[left])
        left += 1
    best = max(best, right - left + 1)`,
      steps: ['Choose the window state: a Counter, a running sum, or a count of bad items.', 'Longest: update the answer AFTER shrinking.', 'Shortest: shrink WHILE VALID and update inside the while loop.'],
    },
  ],
  demos: [3],
  complexity: [
    ['Fixed or variable window', 'O(n)', 'O(k) or O(Σ)', 'left and right each move at most n times'],
    ['Window maximum (monotonic deque)', 'O(n)', 'O(k)', 'each index enters/leaves the deque once'],
  ],
  tips: [
    'Needs monotonicity: with negative numbers, "sum ≤ k" windows break. Use prefix sums + a hash map (560) instead.',
    'Count subarrays with at most k: add right − left + 1 at each step. For exactly k: atMost(k) − atMost(k − 1).',
    'Distinct characters = len(counter) after deleting keys that hit 0.',
    'Longest Repeating Character Replacement: the window is valid if length − max_freq ≤ k.',
    'Minimum Window Substring: track "need" counts and how many characters are fully satisfied.',
  ],
  ds: ['arrays', 'hashing', 'stacks-queues'],
  cs225: 'Amortized analysis: the inner while looks nested, but left only moves forward. That\'s the same argument that makes array-list doubling O(1) per append.',
  stages: [
    { title: 'Fixed windows', items: [
      [643, 'Maximum Average Subarray I', 'E', 'Fixed template; divide by k at the end.', 'fixed'],
      [1423, 'Maximum Points You Can Obtain from Cards', 'M', 'Taking k from the ends = leaving a middle window of n − k with the minimum sum.', 'fixed'],
      [2461, 'Maximum Sum of Distinct Subarrays With Length K', 'M', 'Fixed window + Counter; valid when len(counter) == k.', 'fixed'],
      [438, 'Find All Anagrams in a String', 'M', 'Fixed window of len(p); compare counts.', 'fixed'],
    ] },
    { title: 'Variable windows', items: [
      [3, 'Longest Substring Without Repeating Characters', 'M', 'Shrink while the new char is already in the window (or jump left).', 'variable'],
      [424, 'Longest Repeating Character Replacement', 'M', 'Valid while (right − left + 1) − max_freq ≤ k.', 'variable'],
      [209, 'Minimum Size Subarray Sum', 'M', 'Shortest: shrink WHILE sum ≥ target, updating inside.', 'variable'],
      [713, 'Subarray Product Less Than K', 'M', 'Shrink while product ≥ k; add right − left + 1.', 'variable'],
      [340, 'Longest Substring with At Most K Distinct Characters', 'M', 'Counter; shrink while len(counter) > k.', 'variable'],
    ] },
    { title: 'Stretch', items: [
      [76, 'Minimum Window Substring', 'H', 'need = Counter(t); track how many characters are satisfied; shrink while all are.', 'variable'],
      [239, 'Sliding Window Maximum', 'H', 'Monotonic deque of indices, decreasing values; pop the front when it leaves the window.', 'deque'],
    ] },
  ],
}

export const prefixSum: Pattern = {
  id: 'prefix-sum', title: 'Prefix Sum', hue: 45,
  short: 'Precompute running totals: any range sum becomes one subtraction, and with a hash map you can count subarrays.',
  signals: [
    'Many range-sum queries on a fixed array',
    '"Subarray sum equals k" when numbers can be negative',
    'Balance problems (equal 0s and 1s → map 0 to −1)',
    'Product of everything except yourself',
  ],
  idea: 'Let prefix[i] be the sum of the first i elements. Then sum(l..r) = prefix[r + 1] − prefix[l]. To count subarrays summing to k, notice that a subarray ending here sums to k exactly when some earlier prefix equals prefix − k. Keep a dict of how many times each prefix has appeared.',
  templates: [
    {
      name: 'Range sums',
      code: `prefix = [0]
for x in nums:
    prefix.append(prefix[-1] + x)

def range_sum(l, r):             # inclusive l..r
    return prefix[r + 1] - prefix[l]`,
      steps: ['Leading 0 = the empty prefix. It removes every edge case.', 'prefix has n + 1 entries.', 'Answer each query in O(1).'],
    },
    {
      name: 'Prefix + hash map (count subarrays)',
      code: `seen = {0: 1}                    # the empty prefix
prefix = count = 0
for x in nums:
    prefix += x
    count += seen.get(prefix - k, 0)     # earlier prefixes that leave exactly k
    seen[prefix] = seen.get(prefix, 0) + 1`,
      steps: ['Seed {0: 1} so subarrays that start at index 0 count.', 'Look up BEFORE inserting the current prefix.', 'For the LONGEST such subarray, store each prefix\'s FIRST index instead of a count.'],
    },
  ],
  complexity: [
    ['Build prefix array', 'O(n)', 'O(n)', 'one pass'],
    ['Range query', 'O(1)', '—', 'one subtraction'],
    ['Count subarrays = k', 'O(n)', 'O(n)', 'one pass with a dict'],
    ['2-D prefix build / query', 'O(m·n) / O(1)', 'O(m·n)', 'inclusion–exclusion'],
  ],
  tips: [
    'Transform first: 0 → −1 (Contiguous Array), prefix % k (Continuous Subarray Sum: same remainder twice ⇒ divisible).',
    'Product of Array Except Self: left products × right products, no division.',
    '2-D: P[r+1][c+1] = grid[r][c] + P[r][c+1] + P[r+1][c] − P[r][c].',
    'Sliding window fails with negatives. Prefix sums don\'t care.',
  ],
  ds: ['arrays', 'hashing'],
  stages: [
    { title: 'Warm up', items: [
      [303, 'Range Sum Query - Immutable', 'E', 'The range-sums template as a class.', 'range sums'],
      [238, 'Product of Array Except Self', 'M', 'Left pass then right pass multiplying into the answer.', 'prefix/suffix'],
    ] },
    { title: 'Prefix + hash map', items: [
      [560, 'Subarray Sum Equals K', 'M', 'The prefix + hash map template, exactly.', 'prefix + map'],
      [525, 'Contiguous Array', 'M', '0 → −1; the longest subarray with sum 0 means storing first indices.', 'prefix + map'],
      [325, 'Maximum Size Subarray Sum Equals k', 'M', 'Store the first index of each prefix; length = i − first[prefix − k].', 'prefix + map'],
      [523, 'Continuous Subarray Sum', 'M', 'Store prefix % k → first index; length ≥ 2.', 'prefix + map'],
      [304, 'Range Sum Query 2D - Immutable', 'M', '2-D prefix with inclusion–exclusion.', '2-D prefix'],
    ] },
  ],
}

export const binarySearch: Pattern = {
  id: 'binary-search', title: 'Binary Search', hue: 260,
  short: 'Halve the search space every step, on a sorted array or on the answer itself.',
  signals: [
    'Sorted (or rotated sorted) input',
    '"Minimum X such that…" / "maximum X such that…" with a yes/no check',
    'Constraints hint at O(log n), or at O(n log range)',
  ],
  idea: 'Keep an interval that must contain the answer, and cut it in half with one comparison. The most reusable form is "find the first True": write the condition so it is False…False True…True, and search for the boundary. Binary search on the answer applies the same idea to a range of candidate answers (speeds, capacities, days) with a feasible(x) check.',
  templates: [
    {
      name: 'Exact match',
      code: `lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
return -1`,
      steps: ['Use it when you\'re looking for one specific value.', 'Both bounds move past mid, so the loop always shrinks.'],
    },
    {
      name: 'First True (boundary / answer search)',
      code: `lo, hi = LOW, HIGH              # the answer is somewhere in [lo, hi]
while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid):           # False False ... True True
        hi = mid                # mid could be the answer
    else:
        lo = mid + 1
return lo                       # the first value where feasible is True`,
      steps: ['Define feasible(x) and convince yourself it is monotonic.', 'Pick bounds that surely contain the answer (e.g. 1 .. max(piles)).', 'lo < hi with hi = mid never loops forever, because mid rounds down.'],
    },
  ],
  complexity: [
    ['Search a sorted array', 'O(log n)', 'O(1)', 'the interval halves each step'],
    ['Search on the answer', 'O(log R · cost(feasible))', 'O(1)', 'R = size of the answer range'],
    ['bisect.bisect_left / insort', 'O(log n) / O(n)', '—', 'insort still shifts elements'],
  ],
  tips: [
    'Pick ONE template and always use it. Most off-by-one bugs come from mixing styles.',
    'Rotated array: one half around mid is always sorted. Check whether the target falls inside it.',
    'Find Peak Element: compare nums[mid] with nums[mid + 1] and climb uphill.',
    'Koko / Ship Packages / Split Array: binary search on the answer, where feasible = "can we finish with this speed/capacity?".',
    'Python: bisect_left(a, x) is the first index with a[i] ≥ x, and bisect_right the first with a[i] > x.',
  ],
  ds: ['arrays', 'balanced-trees'],
  cs225: 'BST search is binary search on a tree: O(h). Balanced trees like AVL guarantee h = O(log n), and B-trees put many keys in each node to keep disk searches shallow.',
  stages: [
    { title: 'Warm up', items: [
      [704, 'Binary Search', 'E', 'Exact-match template.', 'exact'],
      [35, 'Search Insert Position', 'E', 'First index with nums[i] ≥ target (bisect_left).', 'first true'],
      [278, 'First Bad Version', 'E', 'First True with feasible = isBadVersion.', 'first true'],
    ] },
    { title: 'On arrays', items: [
      [34, 'Find First and Last Position of Element in Sorted Array', 'M', 'Two boundary searches: first ≥ target and first > target.', 'first true'],
      [74, 'Search a 2D Matrix', 'M', 'Treat it as one sorted array: index → (i // cols, i % cols).', 'exact'],
      [162, 'Find Peak Element', 'M', 'If nums[mid] < nums[mid + 1], a peak is to the right.', 'first true'],
      [153, 'Find Minimum in Rotated Sorted Array', 'M', 'Compare nums[mid] with nums[hi].', 'first true'],
      [33, 'Search in Rotated Sorted Array', 'M', 'Find which half is sorted, then check whether the target is inside it.', 'exact'],
      [981, 'Time Based Key-Value Store', 'M', 'Per key, a list of (time, value); bisect for the last time ≤ t.', 'bisect'],
      [378, 'Kth Smallest Element in a Sorted Matrix', 'M', 'Search on the value; count elements ≤ mid with a staircase walk.', 'answer search'],
    ] },
    { title: 'Binary search on the answer', items: [
      [875, 'Koko Eating Bananas', 'M', 'feasible(speed) = total hours ≤ h; bounds 1 .. max(piles).', 'answer search'],
      [1011, 'Capacity To Ship Packages Within D Days', 'M', 'feasible(cap) = greedy days needed ≤ D; lo = max(weights).', 'answer search'],
      [410, 'Split Array Largest Sum', 'H', 'Same as shipping packages: feasible(limit) = pieces needed ≤ k.', 'answer search'],
      [4, 'Median of Two Sorted Arrays', 'H', 'Binary search the partition of the shorter array.', 'partition'],
    ] },
  ],
}

export const intervals: Pattern = {
  id: 'intervals', title: 'Intervals', hue: 20,
  short: 'Sort by start (or end), then sweep: merge overlaps, count simultaneous events, or keep non-overlapping ones.',
  signals: ['A list of [start, end] pairs', 'Meetings, rooms, bookings, balloons', '"overlap", "merge", "free time", "minimum removals"'],
  idea: 'Once intervals are sorted by start, an interval can only overlap the ones just before it, so a single pass is enough. Two intervals [a, b] and [c, d] overlap exactly when a ≤ d and c ≤ b. To keep the MOST non-overlapping intervals, sort by END and greedily take whatever finishes first.',
  templates: [
    {
      name: 'Merge overlapping',
      code: `intervals.sort()                      # by start
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)   # overlap: extend
    else:
        merged.append([start, end])`,
      steps: ['Sort by start.', 'Compare each interval only with the last merged one.', 'Extend with max(): the new interval may sit entirely inside.'],
    },
    {
      name: 'How many at once (min meeting rooms)',
      code: `import heapq

intervals.sort()
ends = []                             # min-heap: end times of rooms in use
for start, end in intervals:
    if ends and ends[0] <= start:
        heapq.heappop(ends)           # a room freed up; reuse it
    heapq.heappush(ends, end)
rooms = len(ends)`,
      steps: ['The heap holds the end time of every room currently in use.', 'If the earliest-ending room is free by now, reuse it.', 'The heap size at the end is the peak number of rooms.'],
    },
  ],
  complexity: [
    ['Sort + sweep', 'O(n log n)', 'O(n)', 'sorting dominates'],
    ['Rooms with a heap', 'O(n log n)', 'O(n)', 'one push/pop per interval'],
    ['Insert into sorted, disjoint list', 'O(n)', 'O(n)', 'no sort needed'],
  ],
  tips: [
    'Merge → sort by start. Max non-overlapping / min arrows → sort by END.',
    'Decide whether touching intervals ([1,2] and [2,3]) count as overlapping. The examples tell you.',
    'Insert Interval: add everything before, merge everything overlapping, add everything after.',
    'Sweep line: +1 at each start and −1 at each end, then sort the events (ends before starts on ties if touching is OK).',
  ],
  ds: ['arrays', 'heaps'],
  stages: [
    { title: 'Warm up', items: [
      [252, 'Meeting Rooms', 'E', 'Sort; any start < previous end means a conflict.', 'sort'],
      [56, 'Merge Intervals', 'M', 'The merge template.', 'merge'],
      [57, 'Insert Interval', 'M', 'Before / overlapping / after. Already sorted.', 'merge'],
    ] },
    { title: 'Mediums', items: [
      [435, 'Non-overlapping Intervals', 'M', 'Sort by end; count what you have to drop.', 'greedy by end'],
      [452, 'Minimum Number of Arrows to Burst Balloons', 'M', 'Sort by end; shoot at each end, skipping balloons it already burst.', 'greedy by end'],
      [253, 'Meeting Rooms II', 'M', 'The min-heap of end times template.', 'heap'],
      [986, 'Interval List Intersections', 'M', 'Two pointers; the overlap is [max(starts), min(ends)]; advance the one ending first.', 'two pointers'],
    ] },
    { title: 'Stretch', items: [
      [759, 'Employee Free Time', 'H', 'Flatten, sort, merge; the gaps are the answer.', 'merge'],
    ] },
  ],
}

export const cyclicSort: Pattern = {
  id: 'cyclic-sort', title: 'Cyclic Sort & In-place Hashing', hue: 125,
  short: 'Values in 1..n? Use the array itself as a hash table: O(n) time, O(1) extra space.',
  signals: ['Values are in 1..n (or 0..n)', '"missing", "duplicate", "disappeared" numbers', 'O(1) extra space required'],
  idea: 'If every value v belongs to slot v − 1, you can either swap each value into its home (cyclic sort), or mark "v was seen" by negating slot v − 1. Afterwards, the first slot that doesn\'t hold its own value reveals the missing number or the duplicate.',
  templates: [
    {
      name: 'Swap each value home',
      code: `i = 0
while i < len(nums):
    home = nums[i] - 1
    if 0 <= home < len(nums) and nums[home] != nums[i]:
        nums[i], nums[home] = nums[home], nums[i]   # don't advance i yet
    else:
        i += 1
for i, v in enumerate(nums):
    if v != i + 1:
        return i + 1            # first misfit`,
      steps: ['Ignore values outside 1..n.', 'Compare with nums[home], not with home. That stops duplicates from looping forever.', 'Each swap places one value for good, so there are at most n swaps.'],
    },
    {
      name: 'Mark by negation',
      code: `for x in nums:
    i = abs(x) - 1
    nums[i] = -abs(nums[i])     # "value i + 1 exists"
missing = [i + 1 for i, v in enumerate(nums) if v > 0]`,
      steps: ['Use abs(x), because x may already be negated.', 'Positive slots mark values that never appeared.'],
    },
  ],
  demos: [41],
  complexity: [['Swap home or negate', 'O(n)', 'O(1)', 'at most n swaps + n increments (amortized)']],
  tips: [
    'It modifies the input. Mention that, or restore the signs afterwards.',
    'Find the Duplicate Number without modifying: Floyd\'s cycle detection on i → nums[i].',
    'Missing Number also has an XOR trick and a sum-formula trick.',
  ],
  ds: ['arrays', 'hashing'],
  stages: [
    { title: 'Practice', items: [
      [268, 'Missing Number', 'E', 'Cyclic sort, sum formula, or XOR of indices and values.', 'swap home'],
      [448, 'Find All Numbers Disappeared in an Array', 'E', 'Mark by negation; the positive slots are missing.', 'negation'],
      [442, 'Find All Duplicates in an Array', 'M', 'Negate slot; if it is already negative, it is a duplicate.', 'negation'],
      [287, 'Find the Duplicate Number', 'M', 'Floyd\'s cycle detection (no modification allowed).', 'fast/slow'],
      [41, 'First Missing Positive', 'H', 'Swap values 1..n home; the first misfit is the answer.', 'swap home'],
    ] },
  ],
}

export const matrices: Pattern = {
  id: 'matrices', title: 'Matrices', hue: 310,
  short: '2-D index work: layers, transposes, directions, and in-place markers.',
  signals: ['A matrix to rotate, spiral through, or zero out', 'Searching a matrix sorted by rows/columns', 'Simulations on a board (Game of Life)'],
  idea: 'Think in layers (top, bottom, left, right boundaries that shrink) or in transformations (a rotation is a transpose followed by reversing each row). For O(1) extra space, store markers inside the matrix itself, such as the first row and column, or extra bits.',
  templates: [
    {
      name: 'Shrinking boundaries (spiral)',
      code: `top, bottom = 0, len(m) - 1
left, right = 0, len(m[0]) - 1
while top <= bottom and left <= right:
    # walk top row, right column, bottom row, left column
    # then move that boundary inward
    top += 1; right -= 1; bottom -= 1; left += 1`,
      steps: ['Walk one side, then shrink that boundary.', 'Re-check top ≤ bottom and left ≤ right before the 3rd and 4th walks.'],
    },
    {
      name: 'Rotate 90° in place',
      code: `n = len(matrix)
for i in range(n):
    for j in range(i + 1, n):
        matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]   # transpose
for row in matrix:
    row.reverse()                                               # mirror`,
      steps: ['Transpose (swap across the diagonal).', 'Reverse each row for clockwise, or reverse each column for counter-clockwise.'],
    },
  ],
  complexity: [['Visit every cell', 'O(m·n)', 'O(1) in place', 'each cell touched a constant number of times']],
  tips: [
    '[[0] * n] * m creates m references to ONE row. Use [[0] * n for _ in range(m)].',
    'Directions list: for dr, dc in ((0,1),(1,0),(0,-1),(-1,0)).',
    'Search a 2D Matrix II: start at the top-right; move left if too big, down if too small.',
    'Set Matrix Zeroes: use row 0 and column 0 as markers, plus one flag for row 0 itself.',
  ],
  ds: ['arrays'],
  stages: [
    { title: 'Practice', items: [
      [54, 'Spiral Matrix', 'M', 'Shrinking boundaries.', 'boundaries'],
      [48, 'Rotate Image', 'M', 'Transpose, then reverse rows.', 'transform'],
      [73, 'Set Matrix Zeroes', 'M', 'First row/column as markers.', 'in-place markers'],
      [240, 'Search a 2D Matrix II', 'M', 'Staircase from the top-right corner: O(m + n).', 'staircase'],
      [289, 'Game of Life', 'M', 'Encode old and new state in the same cell (e.g. 2 = alive→dead).', 'in-place markers'],
    ] },
  ],
}
