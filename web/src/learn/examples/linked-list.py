# problem: 206
# call: linked([1, 2, 3, 4])
# expect: [4, 3, 2, 1]
# time: O(n)
class Solution:
    def reverseList(self, head):
        prev, cur = None, head
        while cur:
            nxt = cur.next              # save the rest of the list
            cur.next = prev             # flip one arrow
            prev, cur = cur, nxt        # step forward
        return prev
