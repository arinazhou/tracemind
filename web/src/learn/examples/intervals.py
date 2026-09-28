# problem: 56
# call: [[8, 10], [1, 3], [2, 6], [15, 18], [9, 12]]
# expect: [[1, 6], [8, 12], [15, 18]]
# time: O(n log n)
class Solution:
    def merge(self, intervals):
        intervals.sort()                # by start
        merged = []
        for start, end in intervals:
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)   # overlap: extend
            else:
                merged.append([start, end])
        return merged
