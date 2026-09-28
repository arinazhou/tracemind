import { labeledCode, Tracer, randInt } from '../engine/tracer'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { height: number[] }

const { code, L } = labeledCode(`
class Solution:
    def maxArea(self, height):
        left, right = 0, len(height) - 1                   #@init
        best = 0                                           #@best
        while left < right:                                #@while
            width = right - left                           #@w
            area = width * min(height[left], height[right])  #@area
            best = max(best, area)                         #@max
            if height[left] < height[right]:               #@if
                left += 1                                  #@incL
            else:
                right -= 1                                 #@decR
        return best                                        #@ret
`)

function trace({ height }: Input) {
  const t = new Tracer()
  const n = height.length
  let left = 0
  let right = n - 1
  let best: number | null = null
  let width: number | null = null
  let area: number | null = null
  let bestPair: [number, number] | null = null

  const snap = (hl: { shorter?: number } = {}): Panel[] => {
    const tones: Record<number, Tone> = {}
    for (let i = 0; i < n; i++) if (i < left || i > right) tones[i] = 'dim'
    if (bestPair) { tones[bestPair[0]] = tones[bestPair[0]] ?? 'done'; tones[bestPair[1]] = tones[bestPair[1]] ?? 'done' }
    tones[left] = 'active'
    tones[right] = 'active'
    if (hl.shorter !== undefined) tones[hl.shorter] = 'warn'
    return [
      { kind: 'array', title: 'height (water between the pointers)', bars: true, values: height, tones, pointers: { L: left, R: right }, window: left < right ? [left, right] : undefined },
      { kind: 'vars', title: 'variables', vars: { left, right, width, area, best } },
    ]
  }

  t.step(L.init, `Start with the widest container: left = 0, right = ${n - 1}.`, snap())
  best = 0
  t.step(L.best, 'best = 0 so far.', snap())
  while (true) {
    if (!(left < right)) {
      t.step(L.while, 'Pointers met — every useful pair has been considered.', snap())
      break
    }
    t.step(L.while, `left (${left}) < right (${right}) → keep going.`, snap())
    width = right - left
    t.step(L.w, `width = ${right} − ${left} = ${width}.`, snap())
    const h = Math.min(height[left], height[right])
    area = width * h
    t.step(L.area, `The water level is capped by the shorter wall (${h}): area = ${width} × ${h} = ${area}.`,
      snap({ shorter: height[left] < height[right] ? left : right }))
    if (area > best) bestPair = [left, right]
    best = Math.max(best, area)
    t.step(L.max, `best = ${best}.`, snap())
    const moveLeft = height[left] < height[right]
    t.step(L.if, moveLeft
      ? `height[left] = ${height[left]} < height[right] = ${height[right]}. The left wall is the bottleneck.`
      : `height[left] = ${height[left]} ≥ height[right] = ${height[right]}. The right wall is the bottleneck (or they tie).`,
      snap({ shorter: moveLeft ? left : right }))
    if (moveLeft) {
      left++
      t.step(L.incL, 'Move left inward. Keeping the shorter wall can only shrink the width, so the area can never beat this one.', snap())
    } else {
      right--
      t.step(L.decR, 'Move right inward. It is the bottleneck, and pairing it with any closer wall cannot do better.', snap())
    }
  }
  t.step(L.ret, `Maximum water = ${best}.`, snap(), best)
  return t.steps
}

export const containerWithMostWater: Animation<Input> = {
  code,
  defaultInput: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
  trace,
  pyArgs: ({ height }) => [height],
  generate: (n) => ({ height: Array.from({ length: Math.max(2, n) }, () => randInt(1, 20)) }),
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    timeClass: 'n',
    spaceClass: '1',
    sizeLabel: 'n (array length)',
    why: [
      'Every loop iteration moves exactly one pointer inward, so there are at most n − 1 iterations.',
      'Each iteration does constant work: one width, one min, one max.',
      'Only a few integer variables are kept, whatever the input size.',
      'The brute force tries all pairs, which is O(n²). Two pointers is fast because it proves which pairs are safe to skip.',
    ],
  },
}
