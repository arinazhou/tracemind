# problem: 547
# call: [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]]
# expect: 2
# time: O(n²)
class Solution:
    def findCircleNum(self, isConnected):
        n = len(isConnected)
        parent = list(range(n))         # every city starts as its own set

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]   # path compression (halving)
                x = parent[x]
            return x

        groups = n
        for i in range(n):
            for j in range(i + 1, n):
                if isConnected[i][j]:
                    a, b = find(i), find(j)
                    if a != b:
                        parent[a] = b   # union: merge two sets
                        groups -= 1
        return groups
