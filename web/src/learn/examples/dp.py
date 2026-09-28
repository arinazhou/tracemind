# problem: 322
# call: [1, 2, 5], 11
# expect: 3
# time: O(m · n)
class Solution:
    def coinChange(self, coins, amount):
        dp = [0] + [float("inf")] * amount    # dp[a] = fewest coins to make a
        for a in range(1, amount + 1):
            for coin in coins:
                if coin <= a:
                    dp[a] = min(dp[a], dp[a - coin] + 1)
        return dp[amount] if dp[amount] != float("inf") else -1
