import { useState } from 'react'
import { CodeTracer } from '../components/CodeTracer'
import { EXAMPLES, PATTERNS, PROBLEMS } from '../learn'
import { loadDraft, saveDraft, type LabDraft } from '../lab/labDraft'

/** Plain programs (not LeetCode-shaped), to show that anything runnable visualizes. */
const SCRIPTS: { label: string; draft: LabDraft }[] = [
  { label: 'Bubble sort (plain script)', draft: { args: '', driver: '', code: `nums = [5, 1, 4, 2, 8]
n = len(nums)
for i in range(n):
    swapped = False
    for j in range(n - 1 - i):
        if nums[j] > nums[j + 1]:
            nums[j], nums[j + 1] = nums[j + 1], nums[j]
            swapped = True
    print("pass", i + 1, nums)
    if not swapped:
        break
` } },
  { label: 'Recursion: factorial with prints', draft: { args: '', driver: '', code: `def fact(n):
    print("  " * (4 - n) + f"fact({n})")
    if n <= 1:
        return 1
    return n * fact(n - 1)

answer = fact(4)
print("answer:", answer)
` } },
  { label: 'Your own class (a queue from two stacks)', draft: { args: '', driver: '', code: `class MyQueue:
    def __init__(self):
        self.inbox = []
        self.outbox = []

    def push(self, x):
        self.inbox.append(x)

    def pop(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox.pop()

q = MyQueue()
for x in [1, 2, 3]:
    q.push(x)
print(q.pop(), q.pop())
q.push(4)
print(q.pop(), q.pop())
` } },
  { label: 'Reads input() (see the stdin box)', draft: { args: '', driver: '', stdin: '3\n10 20 30\n', code: `n = int(input())
values = list(map(int, input().split()))
total = 0
for v in values:
    total += v
print("average:", total / n)
` } },
]

const STARTER: LabDraft = SCRIPTS[0].draft

export function LabPage() {
  const [draft, setDraft] = useState<LabDraft>(() => loadDraft() ?? STARTER)
  const [version, setVersion] = useState(0) // remount the tracer when an example is loaded
  const change = (d: LabDraft) => { setDraft(d); saveDraft(d) }

  const load = (value: string) => {
    const script = SCRIPTS.find((s) => s.label === value)
    const ex = EXAMPLES[value]
    if (script) change(script.draft)
    else if (ex) change({ code: ex.code, args: ex.args ?? '', driver: ex.driver ?? '' })
    else return
    setVersion((v) => v + 1)
  }

  return (
    <div className="lesson">
      <div className="eyebrow">Tools</div>
      <h1 className="page-title">Code Visualizer</h1>
      <p className="lede">
        If your Python runs, it visualizes. Paste a plain script, a class, or a LeetCode solution and step through it
        line by line: every variable, arrays with index pointers, dicts, stacks and queues, grids, trees, linked lists,
        your own objects, the call stack, and <code>print</code> output as it appears. <b>⚡ Big-O</b> explains the
        complexity. It all runs inside your browser.
      </p>
      <div className="howto">
        <div className="card howto-card">
          <b>A normal Python program</b>
          <ol>
            <li>Paste the whole program in the editor below, exactly as you'd run it with <code>python file.py</code>.</li>
            <li>Make sure it <i>does</i> something at the bottom, like <code>print(solve([3, 1, 2]))</code>. Only defining functions runs nothing.</li>
            <li>"Run as a script" is picked automatically. If it calls <code>input()</code>, type the input in the stdin box, one line per call.</li>
            <li>Press <b>▶ Visualize</b>, then step with <b>Next</b> / <b>Prev</b> (or <span className="kbd">←</span> <span className="kbd">→</span>, <span className="kbd">space</span> to play).</li>
          </ol>
        </div>
        <div className="card howto-card">
          <b>A LeetCode solution (class Solution)</b>
          <ol>
            <li>Paste it as submitted. "Call a function" is picked automatically.</li>
            <li>Type the arguments in the <code>Solution().method( … )</code> box, e.g. <code>[2, 7, 11, 15], 9</code>. Use <code>tree([…])</code> or <code>linked([…])</code> for TreeNode / ListNode inputs.</li>
            <li>Press <b>▶ Visualize</b>. <b>⚡ Big-O</b> explains the complexity.</li>
          </ol>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <label className="muted" style={{ fontSize: 13.5, fontWeight: 700 }}>Or load an example:</label>
        <select className="lab-select" value="" onChange={(e) => load(e.target.value)}>
          <option value="" disabled>choose…</option>
          <optgroup label="Any Python program">
            {SCRIPTS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
          </optgroup>
          <optgroup label="Interview pattern examples">
            {PATTERNS.filter((p) => EXAMPLES[p.id]).map((p) => (
              <option key={p.id} value={p.id}>{p.title}: {EXAMPLES[p.id].num}. {PROBLEMS.get(EXAMPLES[p.id].num)?.problem.title}</option>
            ))}
          </optgroup>
        </select>
      </div>
      <CodeTracer
        key={version}
        code={draft.code}
        onCodeChange={(code) => change({ ...draft, code })}
        args={draft.args}
        driver={draft.driver || undefined}
        stdin={draft.stdin}
        onRunInputs={(inputs) => { if (inputs.args !== draft.args || inputs.driver !== draft.driver || inputs.stdin !== (draft.stdin ?? '')) saveDraft({ ...draft, ...inputs }) }}
      />
    </div>
  )
}
