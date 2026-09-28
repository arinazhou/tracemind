# problem: 1
# call: [2, 7, 11, 15], 9
# expect: [0, 1]
# time: O(n)
class Solution:
    def twoSum(self, nums, target):
        seen = {}                       # value -> index
        for i, x in enumerate(nums):
            need = target - x
            if need in seen:            # O(1) average lookup
                return [seen[need], i]
            seen[x] = i
        return []
