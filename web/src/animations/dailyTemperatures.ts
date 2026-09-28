import { labeledCode, Tracer, randInt } from '../engine/tracer'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { temperatures: number[] }

const { code, L } = labeledCode(`
class Solution:
    def dailyTemperatures(self, temperatures):
        answer = [0] * len(temperatures)                   #@ans
        stack = []  # indices, temps strictly decreasing   #@stack
        for i, t in enumerate(temperatures):               #@for
            while stack and temperatures[stack[-1]] < t:   #@while
                j = stack.pop()                            #@pop
                answer[j] = i - j                          #@set
            stack.append(i)                                #@push
        return answer                                      #@ret
`)

function trace({ temperatures: temps }: Input) {
  const t = new Tracer()
  let answer: number[] | null = null
  let stack: number[] | null = null
  let i: number | null = null
  let j: number | null = null

  const snap = (hl: { cmp?: number; set?: number } = {}): Panel[] => {
    const tones: Record<number, Tone> = {}
    stack?.forEach((k) => { tones[k] = 'visited' })
    if (hl.cmp !== undefined) tones[hl.cmp] = 'warn'
    if (i !== null && i < temps.length) tones[i] = 'active'
    const pointers: Record<string, number> = {}
    if (i !== null && i < temps.length) pointers.i = i
    if (j !== null) pointers.j = j
    const panels: Panel[] = [{ kind: 'array', title: 'temperatures', bars: true, values: temps, tones, pointers }]
    if (answer) {
      const aTones: Record<number, Tone> = {}
      if (hl.set !== undefined) aTones[hl.set] = 'match'
      panels.push({ kind: 'array', title: 'answer (days to wait)', aux: true, values: [...answer], tones: aTones })
    }
    if (stack) panels.push({ kind: 'list', style: 'stack', title: 'stack (index:temp)', aux: true, items: stack.map((k) => `${k}:${temps[k]}`) })
    return panels
  }

  answer = new Array(temps.length).fill(0)
  t.step(L.ans, 'Default answer 0 means no warmer day was found.', snap())
  stack = []
  t.step(L.stack, 'The stack holds days still waiting for a warmer day. Their temps decrease from bottom to top.', snap())
  for (let k = 0; k < temps.length; k++) {
    i = k
    j = null
    t.step(L.for, `Day ${k}: ${temps[k]}°.`, snap())
    while (true) {
      const top = stack[stack.length - 1]
      const warmer = stack.length > 0 && temps[top] < temps[k]
      t.step(L.while, !stack.length
        ? 'Stack empty. Nobody is waiting.'
        : warmer
          ? `Day ${top} (${temps[top]}°) < ${temps[k]}°. Day ${k} is its answer!`
          : `Day ${top} (${temps[top]}°) ≥ ${temps[k]}°. Stop popping.`,
        snap({ cmp: stack.length ? top : undefined }))
      if (!warmer) break
      j = stack.pop()!
      t.step(L.pop, `Pop day ${j}.`, snap())
      answer[j] = k - j
      t.step(L.set, `answer[${j}] = ${k} − ${j} = ${k - j}.`, snap({ set: j }))
    }
    stack.push(k)
    j = null
    t.step(L.push, `Push day ${k}. It now waits for its own warmer day.`, snap())
  }
  i = null
  t.step(L.for, 'All days processed. Anyone left on the stack keeps answer 0.', snap())
  t.step(L.ret, `answer = [${answer.join(', ')}].`, snap(), [...answer])
  return t.steps
}

export const dailyTemperatures: Animation<Input> = {
  code,
  defaultInput: { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] },
  trace,
  pyArgs: ({ temperatures }) => [temperatures],
  generate: (n) => ({ temperatures: Array.from({ length: Math.max(1, n) }, () => randInt(30, 100)) }),
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    timeClass: 'n',
    spaceClass: 'n',
    sizeLabel: 'n (days)',
    why: [
      'The nested while loop looks like O(n²), but each index is pushed once and popped at most once.',
      'Total pushes + pops ≤ 2n, so all iterations together are O(n). This is amortized analysis.',
      'The answer array is n. The stack can also reach n on a strictly decreasing input.',
    ],
  },
}
