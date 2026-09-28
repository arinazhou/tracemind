# problem: 704
# call: [-1, 0, 3, 5, 9, 12, 15, 20], 15
# expect: 6
# time: O(log n)
class Solution:
    def search(self, nums, target):
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1            # answer is right of mid
            else:
                hi = mid - 1            # answer is left of mid
        return -1
