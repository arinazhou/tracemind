# problem: 55
# call: [2, 3, 1, 1, 0, 4]
# expect: False
# time: O(n)
class Solution:
    def canJump(self, nums):
        reach = 0                       # farthest index reachable so far
        for i, jump in enumerate(nums):
            if i > reach:
                return False            # stuck before i
            reach = max(reach, i + jump)
        return True
