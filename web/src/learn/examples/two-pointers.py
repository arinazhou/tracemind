# problem: 167
# call: [1, 3, 4, 6, 9], 13
# expect: [3, 5]
# time: O(n)
class Solution:
    def twoSum(self, numbers, target):
        left, right = 0, len(numbers) - 1
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target:
                return [left + 1, right + 1]
            if total < target:
                left += 1               # need a bigger sum
            else:
                right -= 1              # need a smaller sum
        return []
