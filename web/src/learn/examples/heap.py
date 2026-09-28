# problem: 215
# call: [3, 2, 1, 5, 6, 4], 2
# expect: 5
# time: O(n log n)
import heapq

class Solution:
    def findKthLargest(self, nums, k):
        heap = []                       # min-heap of the k largest so far
        for x in nums:
            heapq.heappush(heap, x)
            if len(heap) > k:
                heapq.heappop(heap)     # drop the smallest
        return heap[0]
