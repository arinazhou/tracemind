# problem: 448
# call: [4, 3, 2, 7, 8, 2, 3, 1]
# expect: [5, 6]
# time: O(n)
class Solution:
    def findDisappearedNumbers(self, nums):
        for x in nums:
            i = abs(x) - 1
            nums[i] = -abs(nums[i])     # mark "value i+1 exists" by negating slot i
        return [i + 1 for i, v in enumerate(nums) if v > 0]
