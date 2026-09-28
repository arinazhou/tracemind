// The step-trace format. Every animation is just a list of Steps, each one
// pinned to exactly one code line (debugger-style). Tracers produce them by
// actually running the algorithm, so edited inputs re-animate for free — and
// a future AI helper only has to write a tracer, never hand-draw frames.

export type Tone = 'active' | 'visited' | 'done' | 'warn' | 'dim' | 'match'

export type Panel =
  | ArrayPanel
  | GraphPanel
  | GridPanel
  | ListPanel
  | MapPanel
  | VarsPanel
  | TextPanel

interface PanelBase {
  title: string
  /** Counts toward auxiliary space in the complexity view. */
  aux?: boolean
}

export interface ArrayPanel extends PanelBase {
  kind: 'array'
  values: (string | number)[]
  tones?: Record<number, Tone>
  pointers?: Record<string, number>
  /** Inclusive [l, r] range drawn as a window band. */
  window?: [number, number]
  /** Render values as bar heights (e.g. container with most water). */
  bars?: boolean
  /** Draw → between cells (linked lists). */
  arrows?: boolean
}

export interface GraphNode {
  id: string
  label?: string
  x: number
  y: number
  badge?: string | number
}

export interface GraphPanel extends PanelBase {
  kind: 'graph'
  nodes: GraphNode[]
  edges: [string, string][]
  directed?: boolean
  nodeTones?: Record<string, Tone>
  edgeTones?: Record<string, Tone> // key `${from}->${to}`
}

export interface GridPanel extends PanelBase {
  kind: 'grid'
  cells: (string | number)[][]
  tones?: Record<string, Tone> // key `${r},${c}`
  cursor?: [number, number]
}

export interface ListPanel extends PanelBase {
  kind: 'list'
  style: 'queue' | 'stack'
  items: (string | number)[]
  highlight?: number
}

export interface MapPanel extends PanelBase {
  kind: 'map'
  entries: [string | number, string | number][]
  highlightKey?: string | number
}

export interface TextPanel extends PanelBase {
  kind: 'text'
  text: string
  /** Characters at the end that were produced by this step (highlighted). */
  fresh?: number
}

export interface VarsPanel extends PanelBase {
  kind: 'vars'
  vars: Record<string, string | number | boolean | null>
}

export interface Step {
  /** 1-based line in the solution's `code`. */
  line: number
  note: string
  panels: Panel[]
  /** Set on the final step: the value the Python solution returns. */
  result?: unknown
}

export type GrowthClass = '1' | 'log n' | 'n' | 'n log n' | 'n^2'

export interface Complexity {
  time: string
  space: string
  timeClass: GrowthClass
  spaceClass: GrowthClass
  /** What n measures on the growth chart's x-axis, e.g. "V + E". */
  sizeLabel: string
  /** Short bullets explaining where the cost comes from. */
  why: string[]
}

export interface Animation<I = unknown> {
  code: string
  /** Pretty-printed JSON shown in the input editor. */
  defaultInput: I
  trace: (input: I) => Step[]
  /** Random input of "size" n, used to measure empirical growth. */
  generate: (n: number) => I
  complexity: Complexity
  /** Positional args for the Python method, so `npm run check` can run the real code and compare results. */
  pyArgs: (input: I) => unknown[]
  /** Extra named inputs: shown as presets in the player, and traced by `npm run check` for line coverage. */
  examples?: { label: string; input: I }[]
}
