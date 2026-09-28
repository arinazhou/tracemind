# problem: 643
# call: [1, 12, -5, -6, 50, 3], 4
# expect: 12.75
# time: O(n)
class Solution:
    def findMaxAverage(self, nums, k):
        window = sum(nums[:k])          # first window
        best = window
        for right in range(k, len(nums)):
            window += nums[right] - nums[right - k]   # slide: add one, drop one
            best = max(best, window)
        return best / k
