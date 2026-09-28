import { labeledCode, Tracer, randInt } from '../engine/tracer'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { nums: number[] }

const { code, L } = labeledCode(`
class Solution(object):
    def firstMissingPositive(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        length = len(nums)                                  #@len
        index = 0                                           #@idx0

        while index < length:                               #@while
            if 1 <= nums[index] <= length:                  #@inRange
                correct_i = nums[index] - 1                 #@correct
                if nums[correct_i] != nums[index]:          #@needSwap
                    nums[index], nums[correct_i] = (nums[correct_i], nums[index])  #@swap
                    continue                                #@cont

            index += 1                                      #@inc


        for i in range(length):                             #@for
            if nums[i] - 1 != i:                            #@check
                return i + 1                                #@found

        return length + 1                                   #@retAll
`)

function trace({ nums: original }: Input) {
  const t = new Tracer()
  const nums = [...original]
  const n = nums.length
  let length: number | null = null
  let index: number | null = null
  let correctI: number | null = null
  let i: number | null = null

  const home = (k: number) => nums[k] === k + 1

  const snap = (hl: { cur?: number; target?: number; targetTone?: Tone; pair?: [number, number]; found?: number } = {}): Panel[] => {
    const tones: Record<number, Tone> = {}
    for (let k = 0; k < n; k++) {
      if (home(k)) tones[k] = 'done'
      else if (length !== null && !(nums[k] >= 1 && nums[k] <= n)) tones[k] = 'dim'
    }
    if (hl.target !== undefined) tones[hl.target] = hl.targetTone ?? 'warn'
    if (hl.cur !== undefined) tones[hl.cur] = 'active'
    if (hl.pair) { tones[hl.pair[0]] = 'match'; tones[hl.pair[1]] = 'match' }
    if (hl.found !== undefined) tones[hl.found] = 'warn'
    const pointers: Record<string, number> = {}
    if (index !== null && index < n) pointers.index = index
    if (correctI !== null && correctI !== index) pointers.home = correctI
    if (i !== null) pointers.i = i
    const slotTones: Record<number, Tone> = {}
    for (let k = 0; k < n; k++) if (home(k)) slotTones[k] = 'done'
    if (hl.found !== undefined) slotTones[hl.found] = 'warn'
    return [
      { kind: 'array', title: 'nums (sorted in place)', values: [...nums], tones, pointers },
      { kind: 'array', title: 'value each slot wants: slot k ← k + 1', values: Array.from({ length: n }, (_, k) => k + 1), tones: slotTones },
      {
        kind: 'vars', title: 'variables',
        vars: { length, index, correct_i: correctI, 'nums[index]': index !== null && index < n ? nums[index] : null, i },
      },
    ]
  }

  length = n
  t.step(L.len, `length = ${n}. Answer must be in 1..${n + 1}, so only values 1..${n} matter.`, snap())
  index = 0
  t.step(L.idx0, 'Phase 1: put every value v in 1..length at slot v − 1 (its "home").', snap({ cur: 0 }))

  // phase 1: cyclic sort
  while (true) {
    if (!(index < n)) {
      t.step(L.while, `index = ${index} reached length. Every value that has a home is now in it.`, snap())
      break
    }
    t.step(L.while, `index ${index} < ${n}: look at nums[${index}] = ${nums[index]}.`, snap({ cur: index }))
    const v = nums[index]
    const inRange = v >= 1 && v <= n
    t.step(L.inRange, inRange
      ? `${v} is in 1..${n}, so it has a home: slot ${v - 1}.`
      : `${v} is outside 1..${n}. It can never be the answer's blocker, so leave it.`,
    snap({ cur: index }))
    if (inRange) {
      correctI = v - 1
      t.step(L.correct, `correct_i = ${v} − 1 = ${correctI}.`, snap({ cur: index, target: correctI }))
      const needSwap = nums[correctI] !== v
      t.step(L.needSwap, needSwap
        ? `Slot ${correctI} holds ${nums[correctI]}, not ${v}. Move ${v} home.`
        : correctI === index
          ? `${v} is already home at slot ${index}.`
          : `Slot ${correctI} already holds ${v}. This one is a duplicate, so skip it (no infinite swapping).`,
      snap({ cur: index, target: correctI, targetTone: needSwap ? 'warn' : 'done' }))
      if (needSwap) {
        const evicted = nums[correctI]
        ;[nums[index], nums[correctI]] = [nums[correctI], nums[index]]
        t.step(L.swap, `Swap: ${v} lands home at slot ${correctI}. ${evicted} moves to slot ${index} and needs checking next.`,
          snap({ pair: [index, correctI] }))
        const stay = index
        correctI = null
        t.step(L.cont, `continue without moving index. The new value at slot ${stay} may need a home too.`, snap({ cur: stay }))
        continue
      }
    }
    correctI = null
    index++
    t.step(L.inc, `Nothing more to do at slot ${index - 1}. index = ${index}.`, snap(index < n ? { cur: index } : {}))
  }

  // phase 2: first misfit
  index = null
  for (let k = 0; k < n; k++) {
    i = k
    t.step(L.for, `Phase 2: scan slot ${k}.`, snap({ cur: k }))
    const misfit = nums[k] - 1 !== k
    t.step(L.check, misfit
      ? `nums[${k}] = ${nums[k]}, but slot ${k} wants ${k + 1}. So ${k + 1} is missing!`
      : `nums[${k}] = ${k + 1}. ${k + 1} is present.`,
    snap(misfit ? { found: k } : { cur: k }))
    if (misfit) {
      t.step(L.found, `Return ${k + 1}, the first missing positive.`, snap({ found: k }), k + 1)
      return t.steps
    }
  }
  i = null
  t.step(L.for, `All ${n} slots hold 1..${n}.`, snap())
  t.step(L.retAll, `1..${n} are all present, so the answer is ${n} + 1 = ${n + 1}.`, snap(), n + 1)
  return t.steps
}

export const firstMissingPositive: Animation<Input> = {
  code,
  defaultInput: { nums: [3, 4, -1, 1, 9, 2, 2] },
  examples: [
    { label: 'LeetCode 1', input: { nums: [1, 2, 0] } },
    { label: 'LeetCode 2', input: { nums: [3, 4, -1, 1] } },
    { label: 'nothing fits', input: { nums: [7, 8, 9, 11, 12] } },
    { label: 'all present → n + 1', input: { nums: [2, 3, 1] } },
  ],
  trace,
  pyArgs: ({ nums }) => [nums],
  generate: (n) => {
    const size = Math.max(1, n)
    return { nums: Array.from({ length: size }, () => randInt(-2, size + 2)) }
  },
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    timeClass: 'n',
    spaceClass: '1',
    sizeLabel: 'n (array length)',
    why: [
      'The while loop can revisit a slot (continue), but every swap puts one value in its final home, and a value already home is never swapped again. So there are at most n swaps.',
      'index moves forward at most n times. Swaps + increments ≤ 2n iterations, which is amortized O(n).',
      'Phase 2 is a single pass: O(n).',
      'The array itself is the hash table (value v ↦ slot v − 1), so no set is needed: O(1) extra space. The trade-off is that it modifies the input.',
    ],
  },
}
