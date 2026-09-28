# problem: 743
# call: [[2, 1, 1], [2, 3, 1], [3, 4, 1], [1, 4, 5]], 4, 2
# expect: 2
# time: O((V + E) log V)
import heapq
from collections import defaultdict

class Solution:
    def networkDelayTime(self, times, n, k):
        graph = defaultdict(list)
        for u, v, w in times:
            graph[u].append((v, w))
        dist = {}
        heap = [(0, k)]                 # (distance so far, node)
        while heap:
            d, node = heapq.heappop(heap)
            if node in dist:
                continue                # already finalized with a shorter distance
            dist[node] = d
            for nxt, w in graph[node]:
                if nxt not in dist:
                    heapq.heappush(heap, (d + w, nxt))
        return max(dist.values()) if len(dist) == n else -1
