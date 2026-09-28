import type { Pattern } from '../types'

export const stack: Pattern = {
  id: 'stack', title: 'Stack & Monotonic Stack', hue: 330,
  short: 'LIFO for matching and "most recent unresolved" items; monotonic stacks answer next-greater/smaller in O(n).',
  signals: [
    'Brackets, nesting, "decode", undo',
    'Evaluate an expression',
    '"Next greater/smaller element", "days until warmer", spans',
    'Largest rectangle / histogram',
  ],
  idea: 'A stack holds things that are still waiting for something. For matching, the most recent opener must be closed first. For a monotonic stack, keep indices whose values are increasing or decreasing. A new element pops everything it resolves, and each index is pushed and popped once, so the total is O(n).',
  templates: [
    {
      name: 'Matching / nesting',
      code: `pairs = {")": "(", "]": "[", "}": "{"}
stack = []
for ch in s:
    if ch in pairs:                        # a closer
        if not stack or stack[-1] != pairs[ch]:
            return False
        stack.pop()
    else:
        stack.append(ch)                   # an opener waits
return not stack`,
      steps: ['Push what is waiting, and pop when it gets resolved.', 'At the end, anything left in the stack is unresolved.'],
    },
    {
      name: 'Monotonic stack (next greater element)',
      code: `answer = [-1] * len(nums)
stack = []                                 # indices still waiting
for i, x in enumerate(nums):
    while stack and nums[stack[-1]] < x:   # x resolves them
        j = stack.pop()
        answer[j] = x                      # or i - j for "how far"
    stack.append(i)`,
      steps: ['Store INDICES, since you usually need distances.', 'Next greater → pop while top < x (the stack is decreasing).', 'Next smaller → pop while top > x (the stack is increasing).'],
    },
  ],
  demos: [739],
  complexity: [
    ['Matching', 'O(n)', 'O(n)', 'one push/pop per character'],
    ['Monotonic stack', 'O(n)', 'O(n)', 'amortized: each index is pushed once and popped once'],
  ],
  tips: [
    'Circular arrays (Next Greater Element II): loop 2n times with i % n.',
    'Largest Rectangle: when you pop a bar, its width is i − stack[-1] − 1 (or i if the stack is empty).',
    'Min Stack: push (value, min so far) pairs.',
    'Decode String: push (current string, repeat count) when you see "[", and combine on "]".',
  ],
  ds: ['stacks-queues', 'arrays'],
  cs225: 'Stacks and queues (lecture 7) are ADTs usually built on array lists, so push and pop are O(1) amortized, which is exactly Python\'s list.append / list.pop.',
  stages: [
    { title: 'Stack basics', items: [
      [20, 'Valid Parentheses', 'E', 'The matching template.', 'matching'],
      [155, 'Min Stack', 'M', 'Store (x, min(x, current min)).', 'design'],
      [150, 'Evaluate Reverse Polish Notation', 'M', 'Numbers push; an operator pops two (careful: b then a), use int(a / b).', 'matching'],
      [71, 'Simplify Path', 'M', 'Split on "/"; ".." pops, "." and "" are skipped.', 'matching'],
      [394, 'Decode String', 'M', 'Push (string so far, k) on "["; pop and repeat on "]".', 'matching'],
    ] },
    { title: 'Monotonic stack', items: [
      [496, 'Next Greater Element I', 'E', 'Monotonic stack over nums2 into a dict.', 'monotonic'],
      [739, 'Daily Temperatures', 'M', 'Monotonic stack of indices; answer = i − j.', 'monotonic'],
      [503, 'Next Greater Element II', 'M', 'Loop twice with i % n.', 'monotonic'],
      [853, 'Car Fleet', 'M', 'Sort by position descending; a stack of arrival times, merging slower-behind cars.', 'monotonic'],
    ] },
    { title: 'Stretch', items: [
      [84, 'Largest Rectangle in Histogram', 'H', 'Increasing stack; on pop, height × (i − stack[-1] − 1).', 'monotonic'],
      [32, 'Longest Valid Parentheses', 'H', 'A stack of indices seeded with −1; length = i − stack[-1].', 'matching'],
    ] },
  ],
}

export const linkedList: Pattern = {
  id: 'linked-list', title: 'Linked List', hue: 100,
  short: 'Pointer surgery with three tools: a dummy head, fast/slow pointers, and in-place reversal.',
  signals: ['The input is a ListNode', 'Find the middle / a cycle / the k-th node from the end', 'Reverse all or part of a list', 'Merge or reorder lists'],
  idea: 'You can\'t index a linked list, so you walk it with pointers. A dummy node before the head removes every "what if the head changes?" special case. Fast/slow pointers find middles, cycles, and nodes counted from the end. Reversal needs just prev, cur and nxt.',
  templates: [
    {
      name: 'Reverse in place',
      code: `prev, cur = None, head
while cur:
    nxt = cur.next      # 1. save the rest
    cur.next = prev     # 2. flip one arrow
    prev = cur          # 3. step forward
    cur = nxt
return prev             # the new head`,
      steps: ['Always save next BEFORE rewiring.', 'When cur is None, prev is the new head.'],
    },
    {
      name: 'Fast / slow pointers',
      code: `slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow is fast:          # (cycle detection) they met inside a cycle
        return True
# otherwise slow is the middle when fast runs off the end`,
      steps: ['fast moves 2, slow moves 1.', 'k-th from the end: move fast k steps first, then move both together.', 'Cycle start (142): after they meet, restart one pointer at head and move both by 1.'],
    },
    {
      name: 'Dummy head',
      code: `dummy = ListNode(0, head)
tail = dummy
while ...:
    tail.next = SOME_NODE     # append
    tail = tail.next
return dummy.next`,
      steps: ['Use it whenever the head could be removed or replaced (merge, delete, partition).'],
    },
  ],
  complexity: [
    ['Walk / reverse / fast-slow', 'O(n)', 'O(1)', 'constant number of pointers'],
    ['Recursive versions', 'O(n)', 'O(n)', 'call stack'],
  ],
  tips: [
    'Draw three boxes and the arrows before coding a rewire.',
    'Palindrome list: find the middle, reverse the second half, compare, and optionally restore it.',
    'Reorder List = middle + reverse second half + merge alternating.',
    'LRU Cache = hash map (key → node) + doubly linked list (recency order). OrderedDict.move_to_end does both.',
    'Copy List with Random Pointer: a dict old → new, or interleave copies.',
  ],
  ds: ['linked-lists'],
  cs225: 'List ADT and linked memory (lectures 3–4): O(1) insert/remove at a known node, but O(n) access by index, the opposite trade-off from array lists. CS 225 implements them with head/tail pointers and sentinel nodes, which is our dummy head.',
  stages: [
    { title: 'Warm up', items: [
      [206, 'Reverse Linked List', 'E', 'prev / cur / nxt.', 'reverse'],
      [21, 'Merge Two Sorted Lists', 'E', 'Dummy + tail; attach the smaller node each time.', 'dummy'],
      [876, 'Middle of the Linked List', 'E', 'Fast/slow; slow is the middle.', 'fast/slow'],
      [141, 'Linked List Cycle', 'E', 'Fast/slow; they meet ⇔ there is a cycle.', 'fast/slow'],
      [234, 'Palindrome Linked List', 'E', 'Middle + reverse second half + compare.', 'fast/slow + reverse'],
      [160, 'Intersection of Two Linked Lists', 'E', 'Two pointers that switch heads meet at the intersection.', 'two pointers'],
    ] },
    { title: 'Mediums', items: [
      [19, 'Remove Nth Node From End of List', 'M', 'Dummy; fast goes n + 1 ahead; then delete slow.next.', 'fast/slow + dummy'],
      [2, 'Add Two Numbers', 'M', 'Dummy + carry.', 'dummy'],
      [142, 'Linked List Cycle II', 'M', 'After meeting, restart one at head; they meet at the cycle start.', 'fast/slow'],
      [24, 'Swap Nodes in Pairs', 'M', 'Dummy; rewire prev → second → first → rest.', 'dummy'],
      [143, 'Reorder List', 'M', 'Middle, reverse second half, merge alternating.', 'fast/slow + reverse'],
      [92, 'Reverse Linked List II', 'M', 'Walk to left − 1, then reverse by moving nodes to the front of the section.', 'reverse'],
      [138, 'Copy List with Random Pointer', 'M', 'Map old node → new node in two passes.', 'hash map'],
      [146, 'LRU Cache', 'M', 'dict + doubly linked list (or OrderedDict).', 'design'],
    ] },
    { title: 'Stretch', items: [
      [25, 'Reverse Nodes in k-Group', 'H', 'Check that k nodes exist, reverse them, reconnect, repeat.', 'reverse'],
    ] },
  ],
}

export const heap: Pattern = {
  id: 'heap', title: 'Heap / Priority Queue', hue: 290,
  short: 'Always know the smallest (or largest) item in O(1), and remove it in O(log n).',
  signals: ['"k largest / smallest / closest / most frequent"', 'Merge k sorted things', 'Repeatedly take the best next item (scheduling, simulations)', 'Running median of a stream'],
  idea: 'Python\'s heapq is a min-heap stored in a plain list. For the k LARGEST items, keep a min-heap of size k: its root is the weakest of your current champions, so evict it whenever something better arrives. For a max-heap, push negated values.',
  templates: [
    {
      name: 'Top-k with a size-k heap',
      code: `import heapq

heap = []                          # min-heap of the k best so far
for x in nums:
    heapq.heappush(heap, x)
    if len(heap) > k:
        heapq.heappop(heap)        # drop the weakest
return heap[0]                     # k-th largest`,
      steps: ['k largest → min-heap of size k. k smallest → max-heap (negate).', 'For objects, push tuples (priority, tiebreaker, item).'],
    },
    {
      name: 'K-way merge',
      code: `heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
heapq.heapify(heap)
out = []
while heap:
    val, i, j = heapq.heappop(heap)
    out.append(val)
    if j + 1 < len(lists[i]):
        heapq.heappush(heap, (lists[i][j + 1], i, j + 1))`,
      steps: ['The heap holds the current front of each list.', 'Pop the smallest, then push its successor from the same list.'],
    },
  ],
  complexity: [
    ['push / pop', 'O(log n)', '—', 'sift up / down one path'],
    ['peek heap[0]', 'O(1)', '—', 'root of the tree'],
    ['heapify a list', 'O(n)', 'O(1)', 'not n log n (CS 225 buildHeap proof)'],
    ['Top-k of n', 'O(n log k)', 'O(k)', 'heap never exceeds k'],
  ],
  tips: [
    'Tuples compare element by element. Add an index as a tiebreaker when items aren\'t comparable (ListNode).',
    'Median of a stream: a max-heap for the low half and a min-heap for the high half, sizes within 1.',
    'Task Scheduler: a max-heap of counts, plus a cooldown queue (or the counting formula).',
    'heapq.nlargest(k, it) / nsmallest are fine for one-off queries.',
  ],
  ds: ['heaps'],
  cs225: 'Heaps (lectures 20–21): a complete binary tree stored in an array (CS 225 uses 1-indexing: children 2i and 2i + 1; Python\'s heapq is 0-indexed: 2i + 1 and 2i + 2). heapifyUp/Down are O(log n), buildHeap is O(n), and heap sort is O(n log n).',
  stages: [
    { title: 'Top-k', items: [
      [1046, 'Last Stone Weight', 'E', 'Max-heap via negatives; smash the two largest.', 'max-heap'],
      [215, 'Kth Largest Element in an Array', 'M', 'Min-heap of size k (or quickselect).', 'top-k'],
      [973, 'K Closest Points to Origin', 'M', 'Max-heap of size k keyed by −distance.', 'top-k'],
      [347, 'Top K Frequent Elements', 'M', 'Counter + heap of size k (or bucket sort by frequency).', 'top-k'],
      [692, 'Top K Frequent Words', 'M', 'Key (−count, word) so ties sort alphabetically.', 'top-k'],
      [658, 'Find K Closest Elements', 'M', 'Heap works; binary search on the window start is O(log n + k).', 'top-k'],
    ] },
    { title: 'Scheduling & merging', items: [
      [621, 'Task Scheduler', 'M', 'Max-heap of counts + cooldown queue, or (maxc − 1)(n + 1) + #max.', 'simulation'],
      [355, 'Design Twitter', 'M', 'Merge recent tweets of followees with a heap.', 'k-way merge'],
      [23, 'Merge k Sorted Lists', 'H', 'Heap of (val, i, node); add the next node from the same list.', 'k-way merge'],
      [295, 'Find Median from Data Stream', 'H', 'Two heaps, balanced sizes.', 'two heaps'],
    ] },
  ],
}

export const trie: Pattern = {
  id: 'trie', title: 'Trie', hue: 185,
  short: 'A tree of characters for fast prefix queries: autocomplete, many-word search, prefix counts.',
  signals: ['"starts with" / prefix matching', 'Many words, many queries', 'Word Search with a whole dictionary'],
  idea: 'Each node maps a character to its child, and a flag marks where a word ends. Inserting or searching costs O(L), the word\'s length, no matter how many words are stored. In Python, nested dicts make a complete trie in about ten lines.',
  templates: [
    {
      name: 'Dict-of-dicts trie',
      code: `root = {}

def insert(word):
    node = root
    for ch in word:
        node = node.setdefault(ch, {})
    node["$"] = True                 # end of a word

def starts_with(prefix):
    node = root
    for ch in prefix:
        if ch not in node:
            return False
        node = node[ch]
    return True`,
      steps: ['setdefault creates the child when it is missing.', 'search = starts_with + check "$" at the end.', 'Word Search II: store the whole word at its end node and DFS the board through the trie.'],
    },
  ],
  complexity: [
    ['insert / search / startsWith', 'O(L)', 'O(L) new nodes', 'L = word length'],
    ['Whole trie', '—', 'O(total characters)', 'shared prefixes are stored once'],
  ],
  tips: [
    'Wildcard "." search: DFS over every child at that position.',
    'Word Search II: prune words from the trie once they are found, or it TLEs.',
    'Search suggestions: sort the words, or keep the top 3 at each node.',
  ],
  ds: ['trees', 'hashing'],
  cs225: 'A trie is a tree whose nodes have up to |Σ| children. Like CS 225\'s B-trees (lecture 18), wide nodes keep the tree shallow: height = word length, independent of n.',
  stages: [
    { title: 'Practice', items: [
      [14, 'Longest Common Prefix', 'E', 'Vertical scan works; a trie follows single-child nodes.', 'trie'],
      [208, 'Implement Trie (Prefix Tree)', 'M', 'The template as a class.', 'trie'],
      [211, 'Design Add and Search Words Data Structure', 'M', 'Trie + DFS on ".".', 'trie + DFS'],
      [1268, 'Search Suggestions System', 'M', 'Sort + bisect, or a trie keeping 3 words per node.', 'trie'],
      [212, 'Word Search II', 'H', 'Trie of words + DFS on the board; prune found words.', 'trie + DFS'],
    ] },
  ],
}
