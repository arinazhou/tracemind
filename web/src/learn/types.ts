export type Difficulty = 'Easy' | 'Medium' | 'Hard'

/** [LeetCode number, title, difficulty, hint, template tag?] */
export type ProblemRow = [num: number, title: string, difficulty: 'E' | 'M' | 'H', hint: string, tag?: string]

export interface Template {
  name: string
  code: string
  /** How to fill it in, in order. */
  steps: string[]
}

export interface Pattern {
  id: string
  title: string
  hue: number
  /** One line: what the pattern does. */
  short: string
  /** Signals in a problem statement that point to this pattern. */
  signals: string[]
  /** The core idea, a few sentences. */
  idea: string
  templates: Template[]
  /** Hand-built animations (problem numbers) to show under the worked example. */
  demos?: number[]
  /** [operation, time, space, why] */
  complexity: [string, string, string, string][]
  tips: string[]
  /** Data structure page ids this pattern relies on. */
  ds: string[]
  /** How this connects to CS 225. */
  cs225?: string
  stages: { title: string; items: ProblemRow[] }[]
}

export interface DataStructure {
  id: string
  title: string
  hue: number
  short: string
  what: string
  /** Python toolkit / implementation snippet. */
  python: string
  /** [operation, cost, note] */
  ops: [string, string, string][]
  ideas: string[]
  /** CS 225 (Spring 2024) lectures: [title, slide file stem]. */
  lectures: [string, string][]
  patterns: string[]
  /** A custom page replaces the generic layout (e.g. trees). */
  custom?: boolean
}

export interface WorkedExample {
  num: number
  code: string
  args?: string
  driver?: string
  expect: string
  time: string
}
