import { labeledCode, Tracer } from '../engine/tracer'
import type { Animation, Panel, Tone } from '../engine/types'

type Input = { grid: string[][] }

const { code, L } = labeledCode(`
from collections import deque

class Solution:
    def numIslands(self, grid):
        rows, cols = len(grid), len(grid[0])                       #@dims
        islands = 0                                                #@init
        for r in range(rows):                                      #@forR
            for c in range(cols):                                  #@forC
                if grid[r][c] != "1":                              #@skip
                    continue                                       #@cont
                islands += 1                                       #@found
                grid[r][c] = "0"                                   #@sink0
                queue = deque([(r, c)])                            #@q0
                while queue:                                       #@while
                    cr, cc = queue.popleft()                       #@pop
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):  #@dir
                        nr, nc = cr + dr, cc + dc                  #@nb
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":  #@check
                            grid[nr][nc] = "0"                     #@sink
                            queue.append((nr, nc))                 #@push
        return islands                                             #@ret
`)

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function trace({ grid: original }: Input) {
  const t = new Tracer()
  const grid = original.map((row) => [...row])
  const rows = grid.length
  const cols = rows ? grid[0].length : 0
  // island number per sunk cell, purely for display
  const owner: (number | null)[][] = grid.map((row) => row.map(() => null))
  let islands = 0
  let queue: [number, number][] | null = null
  const vars: Record<string, string | number | null> = { rows, cols, islands: null, r: null, c: null }

  const snap = (hl: { cell?: [number, number]; tone?: Tone; cursor?: [number, number] } = {}): Panel[] => {
    const tones: Record<string, Tone> = {}
    queue?.forEach(([qr, qc]) => { tones[`${qr},${qc}`] = 'visited' })
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (owner[r][c] !== null && !tones[`${r},${c}`]) tones[`${r},${c}`] = 'done'
      else if (grid[r][c] === '0' && owner[r][c] === null) tones[`${r},${c}`] = 'dim'
    }
    if (hl.cell) tones[`${hl.cell[0]},${hl.cell[1]}`] = hl.tone ?? 'active'
    const cells = grid.map((row, r) => row.map((v, c) => (owner[r][c] !== null ? `#${owner[r][c]}` : v)))
    const panels: Panel[] = [{ kind: 'grid', title: 'grid (#k = sunk into island k)', cells, tones, cursor: hl.cursor }]
    if (queue) panels.push({ kind: 'list', style: 'queue', title: 'BFS queue', aux: true, items: queue.map(([a, b]) => `(${a},${b})`) })
    panels.push({ kind: 'vars', title: 'variables', vars: { ...vars, islands } })
    return panels
  }

  t.step(L.dims, `Grid is ${rows} × ${cols}.`, snap())
  t.step(L.init, 'No islands found yet.', snap())
  for (let r = 0; r < rows; r++) {
    vars.r = r
    t.step(L.forR, `Scan row ${r}.`, snap())
    for (let c = 0; c < cols; c++) {
      vars.c = c
      t.step(L.forC, `Look at cell (${r}, ${c}).`, snap({ cursor: [r, c] }))
      if (grid[r][c] !== '1') {
        t.step(L.skip, `(${r}, ${c}) is water or already sunk — not a new island.`, snap({ cursor: [r, c] }))
        t.step(L.cont, 'Skip to the next cell.', snap({ cursor: [r, c] }))
        continue
      }
      t.step(L.skip, `(${r}, ${c}) is unvisited land!`, snap({ cursor: [r, c], cell: [r, c], tone: 'match' }))
      islands++
      t.step(L.found, `New island #${islands}.`, snap({ cursor: [r, c], cell: [r, c], tone: 'match' }))
      grid[r][c] = '0'
      owner[r][c] = islands
      t.step(L.sink0, 'Sink it (mark visited) so we never count it again.', snap({ cursor: [r, c], cell: [r, c] }))
      queue = [[r, c]]
      t.step(L.q0, `Start BFS from (${r}, ${c}).`, snap({ cursor: [r, c] }))
      while (true) {
        if (!queue.length) {
          t.step(L.while, `Queue empty — island #${islands} fully explored.`, snap({ cursor: [r, c] }))
          break
        }
        t.step(L.while, `${queue.length} cell(s) waiting in the queue.`, snap({ cursor: [r, c] }))
        const [cr, cc] = queue.shift()!
        t.step(L.pop, `Expand (${cr}, ${cc}).`, snap({ cursor: [r, c], cell: [cr, cc] }))
        for (const [dr, dc] of DIRS) {
          const dirName = dr === 1 ? 'down' : dr === -1 ? 'up' : dc === 1 ? 'right' : 'left'
          t.step(L.dir, `Try direction ${dirName}.`, snap({ cursor: [r, c], cell: [cr, cc] }))
          const nr = cr + dr
          const nc = cc + dc
          const inside = nr >= 0 && nr < rows && nc >= 0 && nc < cols
          t.step(L.nb, `Neighbor is (${nr}, ${nc}).`, snap({ cursor: [r, c], cell: inside ? [nr, nc] : [cr, cc], tone: inside ? 'warn' : 'active' }))
          const land = inside && grid[nr][nc] === '1'
          t.step(L.check, !inside ? 'Out of bounds — ignore.' : land ? 'Unvisited land — part of this island.' : 'Water or already sunk — ignore.',
            snap({ cursor: [r, c], cell: inside ? [nr, nc] : [cr, cc], tone: land ? 'match' : inside ? 'warn' : 'active' }))
          if (!land) continue
          grid[nr][nc] = '0'
          owner[nr][nc] = islands
          t.step(L.sink, `Sink (${nr}, ${nc}) right away so it's enqueued only once.`, snap({ cursor: [r, c], cell: [nr, nc], tone: 'match' }))
          queue.push([nr, nc])
          t.step(L.push, `Enqueue (${nr}, ${nc}).`, snap({ cursor: [r, c] }))
        }
      }
      queue = null
    }
  }
  vars.r = vars.c = null
  t.step(L.ret, `Found ${islands} island(s).`, snap(), islands)
  return t.steps
}

export const numberOfIslands: Animation<Input> = {
  code,
  defaultInput: {
    grid: [
      ['1', '1', '0', '0', '1'],
      ['1', '0', '0', '1', '1'],
      ['0', '0', '1', '0', '0'],
      ['1', '0', '1', '1', '0'],
    ],
  },
  trace,
  pyArgs: ({ grid }) => [grid],
  generate: (size) => {
    const side = Math.max(1, Math.round(Math.sqrt(size)))
    return { grid: Array.from({ length: side }, () => Array.from({ length: side }, () => (Math.random() < 0.45 ? '1' : '0'))) }
  },
  complexity: {
    time: 'O(m · n)',
    space: 'O(min(m, n))',
    timeClass: 'n',
    spaceClass: 'n',
    sizeLabel: 'm · n (cells)',
    why: [
      'The double loop visits every cell once: O(m·n).',
      'Each land cell is sunk and enqueued at most once, then checks 4 neighbors: O(4·m·n) = O(m·n).',
      'The BFS queue holds one "frontier" of an island. Its worst case is O(min(m, n)), and O(m·n) is a safe upper bound.',
      'Sinking cells in place avoids a separate visited set. That trade mutates the input.',
    ],
  },
}
