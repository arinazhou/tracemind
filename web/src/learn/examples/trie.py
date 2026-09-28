# problem: 208
# driver: t = Trie()
# driver: t.insert("cat")
# driver: t.insert("car")
# driver: t.search("car")
# expect: True
# time: O(n)
class Trie:
    def __init__(self):
        self.root = {}                  # char -> child dict; "$" marks a word end

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return "$" in node
