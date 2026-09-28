import { DATA_STRUCTURES } from './dataStructures'
import { binarySearch, cyclicSort, hashing, intervals, matrices, prefixSum, slidingWindow, twoPointers } from './patterns/foundations'
import { backtracking, bfs, dfs, shortestPath, topoSort, unionFind } from './patterns/graphs'
import { dp, greedy } from './patterns/optimization'
import { heap, linkedList, stack, trie } from './patterns/structures'
import type { Difficulty, Pattern, WorkedExample } from './types'

/** The main track, in learning order. */
export const PATTERNS: Pattern[] = [
  hashing, twoPointers, slidingWindow, prefixSum, binarySearch, intervals, stack, linkedList, heap,
  dfs, bfs, backtracking, topoSort, unionFind, shortestPath, dp, greedy, trie, cyclicSort, matrices,
]

export { DATA_STRUCTURES }

export const patternById = (id: string) => PATTERNS.find((p) => p.id === id)
export const dsById = (id: string) => DATA_STRUCTURES.find((d) => d.id === id)

// ---------------------------------------------------------------- worked examples

const files = import.meta.glob('./examples/*.py', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parseExample(src: string): WorkedExample {
  const header: Record<string, string[]> = {}
  const code: string[] = []
  for (const line of src.split('\n')) {
    const m = !code.length && line.match(/^# (\w+): (.*)$/)
    if (m) (header[m[1]] ??= []).push(m[2])
    else code.push(line)
  }
  return {
    num: Number(header.problem?.[0]),
    code: code.join('\n').trim() + '\n',
    args: header.call?.[0],
    driver: header.driver?.join('\n'),
    expect: header.expect?.[0] ?? '',
    time: header.time?.[0] ?? '',
  }
}

/** pattern id → its worked example */
export const EXAMPLES: Record<string, WorkedExample> = Object.fromEntries(
  Object.entries(files).map(([path, src]) => [path.replace(/^.*\/(.*)\.py$/, '$1'), parseExample(src)]),
)

// ---------------------------------------------------------------- problems

export interface Problem {
  num: number
  title: string
  slug: string
  difficulty: Difficulty
  hint: string
  tag?: string
}

const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' } as const
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

/** Every problem, keyed by LeetCode number, with the pattern that teaches it. */
export const PROBLEMS = new Map<number, { problem: Problem; pattern: Pattern }>()
for (const p of PATTERNS) {
  for (const stage of p.stages) {
    for (const [num, title, d, hint, tag] of stage.items) {
      if (!PROBLEMS.has(num)) PROBLEMS.set(num, { problem: { num, title, slug: slugify(title), difficulty: DIFF[d], hint, tag }, pattern: p })
    }
  }
}

export const patternProblems = (p: Pattern) => p.stages.flatMap((s) => s.items.map(([num]) => num))
export const leetcodeUrl = (p: { slug: string }) => `https://leetcode.com/problems/${p.slug}/`
