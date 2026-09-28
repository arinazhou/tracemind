# problem: 560
# call: [1, 2, 3, -2, 2], 3
# expect: 4
# time: O(n)
class Solution:
    def subarraySum(self, nums, k):
        count = 0
        prefix = 0
        seen = {0: 1}                   # prefix sum -> how many times seen
        for x in nums:
            prefix += x
            count += seen.get(prefix - k, 0)   # earlier prefixes that leave exactly k
            seen[prefix] = seen.get(prefix, 0) + 1
        return count
