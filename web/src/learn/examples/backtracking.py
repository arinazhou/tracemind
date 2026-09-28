# problem: 78
# call: [1, 2, 3]
# expect: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
# time: O(n · 2ⁿ)
class Solution:
    def subsets(self, nums):
        result, path = [], []

        def backtrack(start):
            result.append(path[:])      # every node of the decision tree is a subset
            for i in range(start, len(nums)):
                path.append(nums[i])    # choose
                backtrack(i + 1)        # explore
                path.pop()              # un-choose

        backtrack(0)
        return result
