import pytest

from app.analyzer import analyze

CASES = {
    "course_schedule_bfs": ("""
from collections import deque
class Solution:
    def canFinish(self, numCourses, prerequisites):
        graph = [[] for _ in range(numCourses)]
        indegree = [0] * numCourses
        for course, pre in prerequisites:
            graph[pre].append(course)
            indegree[course] += 1
        queue = deque(i for i in range(numCourses) if indegree[i] == 0)
        taken = 0
        while queue:
            node = queue.popleft()
            taken += 1
            for nxt in graph[node]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
        return taken == numCourses
""", "O(V + E)", "O(V + E)"),
    "islands_bfs": ("""
from collections import deque
class Solution:
    def numIslands(self, grid):
        rows, cols = len(grid), len(grid[0])
        islands = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != "1":
                    continue
                islands += 1
                grid[r][c] = "0"
                queue = deque([(r, c)])
                while queue:
                    cr, cc = queue.popleft()
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                            grid[nr][nc] = "0"
                            queue.append((nr, nc))
        return islands
""", "O(m · n)", None),
    "islands_dfs": ("""
class Solution:
    def numIslands(self, grid):
        def dfs(r, c):
            if r < 0 or c < 0 or r >= len(grid) or c >= len(grid[0]) or grid[r][c] != "1":
                return
            grid[r][c] = "0"
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        count = 0
        for r in range(len(grid)):
            for c in range(len(grid[0])):
                if grid[r][c] == "1":
                    dfs(r, c)
                    count += 1
        return count
""", "O(m · n)", "O(m · n)"),
    "container": ("""
class Solution:
    def maxArea(self, height):
        left, right = 0, len(height) - 1
        best = 0
        while left < right:
            best = max(best, (right - left) * min(height[left], height[right]))
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return best
""", "O(n)", "O(1)"),
    "longest_substring": ("""
class Solution:
    def lengthOfLongestSubstring(self, s):
        last = {}
        left = best = 0
        for right, ch in enumerate(s):
            if ch in last and last[ch] >= left:
                left = last[ch] + 1
            last[ch] = right
            best = max(best, right - left + 1)
        return best
""", "O(n)", "O(n)"),
    "daily_temperatures": ("""
class Solution:
    def dailyTemperatures(self, temperatures):
        answer = [0] * len(temperatures)
        stack = []
        for i, t in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < t:
                j = stack.pop()
                answer[j] = i - j
            stack.append(i)
        return answer
""", "O(n)", "O(n)"),
    "binary_search": ("""
class Solution:
    def search(self, nums, target):
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1
""", "O(log n)", "O(1)"),
    "two_sum_brute": ("""
class Solution:
    def twoSum(self, nums, target):
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
""", "O(n²)", "O(1)"),
    "merge_intervals": ("""
class Solution:
    def merge(self, intervals):
        intervals.sort()
        out = []
        for s, e in intervals:
            if out and out[-1][1] >= s:
                out[-1][1] = max(out[-1][1], e)
            else:
                out.append([s, e])
        return out
""", "O(n log n)", "O(n)"),
    "kth_largest_heap": ("""
import heapq
class Solution:
    def findKthLargest(self, nums, k):
        heap = []
        for x in nums:
            heapq.heappush(heap, x)
            if len(heap) > k:
                heapq.heappop(heap)
        return heap[0]
""", "O(n log n)", "O(n)"),
    "fib_naive": ("""
class Solution:
    def fib(self, n):
        if n < 2:
            return n
        return self.fib(n - 1) + self.fib(n - 2)
""", "O(2ⁿ)", None),
    "climb_memo": ("""
from functools import cache
class Solution:
    def climbStairs(self, n):
        @cache
        def go(i):
            if i <= 1:
                return 1
            return go(i - 1) + go(i - 2)
        return go(n)
""", "O(n)", "O(n)"),
    "max_depth": ("""
class Solution:
    def maxDepth(self, root):
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))
""", "O(n)", "O(n)"),
    "first_missing_positive_cyclic_sort": ("""
class Solution(object):
    def firstMissingPositive(self, nums):
        length = len(nums)
        index = 0
        while index < length:
            if 1 <= nums[index] <= length:
                correct_i = nums[index] - 1
                if nums[correct_i] != nums[index]:
                    nums[index], nums[correct_i] = (nums[correct_i], nums[index])
                    continue
            index += 1
        for i in range(length):
            if nums[i] - 1 != i:
                return i + 1
        return length + 1
""", "O(n)", "O(1)"),
    "subsets": ("""
class Solution:
    def subsets(self, nums):
        res, path = [], []
        def backtrack(start):
            res.append(path[:])
            for i in range(start, len(nums)):
                path.append(nums[i])
                backtrack(i + 1)
                path.pop()
        backtrack(0)
        return res
""", "O(n · 2ⁿ)", None),
}


@pytest.mark.parametrize("name", CASES)
def test_known_solutions(name):
    code, time, space = CASES[name]
    out = analyze(code)
    assert out["ok"], out
    assert out["time"] == time, (name, out)
    if space:
        assert out["space"] == space, (name, out)
    assert out["findings"], "every result should explain itself"


def test_cyclic_sort_is_explained_as_such():
    code = CASES["first_missing_positive_cyclic_sort"][0]
    messages = [f["message"] for f in analyze(code)["findings"]]
    assert any("cyclic sort" in m for m in messages)
    assert not any("two pointers" in m for m in messages)


def test_syntax_error_is_reported():
    out = analyze("def f(:\n  pass")
    assert not out["ok"] and "line 1" in out["error"]


def test_list_membership_is_flagged():
    out = analyze("""
def f(nums):
    seen = []
    for x in nums:
        if x in seen:
            return True
        seen.append(x)
""")
    assert out["time"] == "O(n²)"
    assert any("use a set" in f["message"] for f in out["findings"])
