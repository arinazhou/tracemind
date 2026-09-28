import { labeledCode, Tracer } from '../engine/tracer'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { s: string }

const { code, L } = labeledCode(`
class Solution:
    def lengthOfLongestSubstring(self, s):
        last = {}                                          #@map
        left = best = 0                                    #@init
        for right, ch in enumerate(s):                     #@for
            if ch in last and last[ch] >= left:            #@if
                left = last[ch] + 1                        #@jump
            last[ch] = right                               #@set
            best = max(best, right - left + 1)             #@best
        return best                                        #@ret
`)

function trace({ s }: Input) {
  const t = new Tracer()
  const chars = [...s]
  let last: Map<string, number> | null = null
  let left: number | null = null
  let right: number | null = null
  let best: number | null = null
  let bestRange: [number, number] | null = null

  const snap = (hl: { dup?: number; key?: string } = {}): Panel[] => {
    const tones: Record<number, Tone> = {}
    if (bestRange) for (let i = bestRange[0]; i <= bestRange[1]; i++) tones[i] = 'done'
    if (right !== null) tones[right] = 'active'
    if (hl.dup !== undefined) tones[hl.dup] = 'warn'
    const pointers: Record<string, number> = {}
    if (left !== null) pointers.L = left
    if (right !== null) pointers.R = right
    const panels: Panel[] = [{
      kind: 'array', title: 's', values: chars, tones, pointers,
      window: left !== null && right !== null && left <= right ? [left, right] : undefined,
    }]
    if (last) panels.push({ kind: 'map', title: 'last seen index', aux: true, entries: [...last.entries()], highlightKey: hl.key })
    panels.push({ kind: 'vars', title: 'variables', vars: { left, right, ch: right !== null ? chars[right] ?? null : null, best } })
    return panels
  }

  last = new Map()
  t.step(L.map, 'last[ch] remembers the most recent index of each character.', snap())
  left = 0
  best = 0
  t.step(L.init, 'The window [left, right] will always hold unique characters.', snap())
  for (let r = 0; r < chars.length; r++) {
    right = r
    const ch = chars[r]
    t.step(L.for, `Extend the window: right = ${r}, ch = '${ch}'.`, snap())
    const prev = last.get(ch)
    const clash = prev !== undefined && prev >= left
    t.step(L.if, clash
      ? `'${ch}' was already seen at index ${prev}, inside the window → duplicate!`
      : prev !== undefined
        ? `'${ch}' was seen at ${prev}, but that is left of the window. No clash.`
        : `'${ch}' has not been seen yet. No clash.`,
      snap({ dup: clash ? prev : undefined, key: prev !== undefined ? ch : undefined }))
    if (clash) {
      left = prev! + 1
      t.step(L.jump, `Jump left past the old '${ch}': left = ${left}. No need to slide one step at a time.`, snap({ key: ch }))
    }
    last.set(ch, r)
    t.step(L.set, `Record last['${ch}'] = ${r}.`, snap({ key: ch }))
    const len = r - left + 1
    if (len > best) bestRange = [left, r]
    best = Math.max(best, len)
    t.step(L.best, `Window length = ${len}; best = ${best}.`, snap())
  }
  right = null
  t.step(L.for, 'Reached the end of the string.', snap())
  t.step(L.ret, `Longest substring without repeats has length ${best}.`, snap(), best)
  return t.steps
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'

export const longestSubstring: Animation<Input> = {
  code,
  defaultInput: { s: 'abcabcbb' },
  trace,
  pyArgs: ({ s }) => [s],
  generate: (n) => ({ s: Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * 26)]).join('') }),
  complexity: {
    time: 'O(n)',
    space: 'O(min(n, Σ))',
    timeClass: 'n',
    spaceClass: '1',
    sizeLabel: 'n (string length)',
    why: [
      'right visits each index exactly once, and left only ever jumps forward.',
      'Each step does O(1) hash-map work.',
      'The map holds at most one entry per distinct character. With a fixed alphabet Σ (26 letters) that is O(1), which is why the space curve flattens out.',
    ],
  },
}
