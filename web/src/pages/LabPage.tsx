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
    if (value === '__empty') change({ code: '', args: '', driver: '', stdin: '' })
    else if (script) change(script.draft)
    else if (ex) change({ code: ex.code, args: ex.args ?? '', driver: ex.driver ?? '' })
    else return
    setVersion((v) => v + 1)
  }

  return (
    <div className="lesson">
      <div className="eyebrow">Tools</div>
      <h1 className="page-title">Code Visualizer</h1>
      <p className="lede">
        <b>If your Python runs, it visualizes.</b> Paste your code in step 1, press <b>▶ Visualize</b>, then step through
        it line by line: variables, arrays with index pointers, dicts, stacks, queues, grids, trees, linked lists, your
        own objects, the call stack and <code>print</code> output. It works out how to run your code by itself.
      </p>
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <label className="muted" style={{ fontSize: 13.5, fontWeight: 700 }}>New here? Load an example:</label>
        <select className="lab-select" value="" onChange={(e) => load(e.target.value)}>
          <option value="" disabled>choose…</option>
          <option value="__empty">(empty editor: paste your own code)</option>
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
        scrollOnRun
        onRunInputs={(inputs) => { if (inputs.args !== draft.args || inputs.driver !== draft.driver || inputs.stdin !== (draft.stdin ?? '')) saveDraft({ ...draft, ...inputs }) }}
      />
    </div>
  )
}
