// Search over every catalogued LeetCode problem plus the lesson and data-structure
// pages. Matches numbers ("15", "#15"), titles in any word order, word prefixes
// ("long subs"), common nicknames ("lru", "bst", "3sum") and loose typos.
import { DATA_STRUCTURES, PATTERNS, PROBLEMS, type Problem } from './index'
import type { Pattern } from './types'

export type SearchHit =
  | { kind: 'problem'; problem: Problem; pattern: Pattern; score: number; partial?: boolean }
  | { kind: 'pattern'; pattern: Pattern; score: number }
  | { kind: 'ds'; id: string; title: string; short: string; score: number }

/** Nicknames people type → words that appear in the real title or topic. */
const ALIASES: Record<string, string> = {
  lru: 'lru cache',
  bst: 'binary search tree',
  lca: 'lowest common ancestor',
  lis: 'longest increasing subsequence',
  lcs: 'longest common subsequence',
  dp: 'dynamic programming',
  bfs: 'breadth-first search',
  dfs: 'depth-first search',
  kth: 'kth',
  uf: 'union-find',
  dsu: 'union-find disjoint sets',
  mst: 'minimum spanning tree weighted graphs',
  topo: 'topological sort',
  pq: 'heap priority queue',
  ll: 'linked list',
  rpn: 'reverse polish notation',
  '2sum': 'two sum',
  twosum: 'two sum',
  '3sum': '3sum',
  '4sum': '4sum',
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Allow one typo in words of 5+ letters (edit distance ≤ 1). */
function close(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a.length < 5) return false
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

/** 0 = no match; higher = better. Every query word must hit some title word (unless partial). */
function scoreText(query: string[], text: string, partial = false): number {
  const words = norm(text).split(' ')
  const joined = words.join(' ')
  let score = 0
  for (const q of query) {
    let best = 0
    for (const w of words) {
      if (w === q) best = Math.max(best, 10)
      else if (w.startsWith(q)) best = Math.max(best, 7)
      else if (q.length >= 4 && w.includes(q)) best = Math.max(best, 2)
      else if (close(q, w.slice(0, q.length + 1)) || close(q, w)) best = Math.max(best, 3)
    }
    if (!best && !partial) return 0
    score += best
  }
  if (partial) {
    // related-problem fallback: most of the meaningful words must still match
    const meaningful = query.filter((w) => w.length >= 3 && !/^(i+|ii|iii|iv|v)$/.test(w))
    const hit = meaningful.filter((q) => words.some((w) => w === q || w.startsWith(q) || close(q, w)))
    if (!hit.length || hit.length * 2 < meaningful.length) return 0
  }
  if (joined.startsWith(query.join(' '))) score += 15 // "longest sub" → Longest Substring…
  return score
}

export function search(raw: string, limit = 12): SearchHit[] {
  const q = norm(raw.replace(/^#/, ''))
  if (!q) return []
  const expanded = q.split(' ').flatMap((w) => norm(ALIASES[w] ?? w).split(' '))
  const hits: SearchHit[] = []

  // problems: by number first, then by title
  const asNum = /^\d+$/.test(q) ? Number(q) : null
  for (const { problem, pattern } of PROBLEMS.values()) {
    let score = 0
    if (asNum !== null) {
      if (problem.num === asNum) score = 1000
      else if (String(problem.num).startsWith(q)) score = 500 - String(problem.num).length
    }
    score = Math.max(score, scoreText(expanded, problem.title) * 3, scoreText(q.split(' '), problem.title) * 3)
    if (score) hits.push({ kind: 'problem', problem, pattern, score })
  }

  // topics: interview patterns and data structure pages
  for (const p of PATTERNS) {
    const byTitle = Math.max(scoreText(expanded, `${p.title} ${p.id}`), scoreText(q.split(' '), p.title))
    // algorithm names that only appear in the lesson text (Dijkstra, Kahn, Kruskal…)
    const byText = scoreText(q.split(' '), `${p.short} ${p.signals.join(' ')} ${p.templates.map((t) => t.name).join(' ')}`)
    const s = byTitle ? byTitle * 3 + 5 : byText
    if (s) hits.push({ kind: 'pattern', pattern: p, score: s })
  }
  for (const d of DATA_STRUCTURES) {
    const byTitle = Math.max(scoreText(expanded, `${d.title} ${d.id}`), scoreText(q.split(' '), d.title))
    const byText = scoreText(q.split(" "), `${d.short} ${d.what} ${d.ideas.join(" ")}`)
    const s = byTitle ? byTitle * 3 : byText
    if (s) hits.push({ kind: 'ds', id: d.id, title: d.title, short: d.short, score: s })
  }

  // nothing matched every word: suggest the closest problems (their topic is a strong hint)
  if (!hits.length) {
    for (const { problem, pattern } of PROBLEMS.values()) {
      const s = scoreText(expanded, problem.title, true)
      if (s) hits.push({ kind: 'problem', problem, pattern, score: s, partial: true })
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  return hits
    .sort((a, b) => b.score - a.score || (a.kind === 'problem' && b.kind === 'problem' ? a.problem.num - b.problem.num : 0))
    .slice(0, limit)
}
