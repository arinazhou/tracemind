/**
 * Validates every registered animation:
 *   1. the example input traces, and every step points at a real code line
 *   2. every executable line is visited at least once (warns only)
 *   3. random inputs of several sizes trace without errors
 *   4. the tracer's final `result` equals what the *real Python code* returns,
 *      on the example and on random inputs
 * Usage: npm run check [-- <problem number>]
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ANIMATIONS } from '../src/animations'

const only = process.argv[2] ? Number(process.argv[2]) : null
const runner = join(process.cwd(), 'scripts', 'run_solution.py')
const tmp = mkdtempSync(join(tmpdir(), 'tracemind-'))
let failed = 0

const NOT_EXECUTABLE = /^\s*(#|$|class |def |from |import |else:|try:|finally:|@)/

for (const [num, anim] of Object.entries(ANIMATIONS)) {
  if (only !== null && +num !== only) continue
  const errors: string[] = []
  const warnings: string[] = []
  const lines = anim.code.split('\n')
  const inputs = [anim.defaultInput, ...[4, 8, 16, 32, 64].map((n) => anim.generate(n))]
  const results: unknown[] = []

  inputs.forEach((input, k) => {
    const label = k === 0 ? 'example' : `random #${k}`
    try {
      const steps = anim.trace(structuredClone(input))
      if (!steps.length) errors.push(`${label}: no steps`)
      steps.forEach((s, i) => {
        if (!(s.line >= 1 && s.line <= lines.length)) errors.push(`${label}: step ${i + 1} points at line ${s.line}`)
        if (!s.note) errors.push(`${label}: step ${i + 1} has no note`)
      })
      const last = steps.at(-1)
      if (last?.result === undefined) errors.push(`${label}: final step has no result`)
      results.push(last?.result)
      if (k === 0) {
        const hit = new Set(steps.map((s) => s.line))
        lines.forEach((text, i) => {
          if (!NOT_EXECUTABLE.test(text) && !hit.has(i + 1)) warnings.push(`line ${i + 1} is never stepped on the example: ${text.trim()}`)
        })
      }
    } catch (e) {
      errors.push(`${label}: ${e instanceof Error ? e.message : e}`)
    }
  })

  // run the real Python solution on the same inputs
  try {
    const file = join(tmp, `${num}.py`)
    writeFileSync(file, anim.code)
    const stdin = inputs.map((i) => JSON.stringify(anim.pyArgs(structuredClone(i)))).join('\n')
    const out = execFileSync('python3', [runner, file], { input: stdin, encoding: 'utf8' }).trim().split('\n')
    out.forEach((line, k) => {
      const want = JSON.stringify(results[k])
      if (line !== want) errors.push(`${k === 0 ? 'example' : `random #${k}`}: python returned ${line}, tracer says ${want}`)
    })
  } catch (e) {
    errors.push(`python run failed: ${e instanceof Error ? e.message.split('\n').slice(0, 6).join('\n') : e}`)
  }

  const ok = errors.length === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${num}  (${inputs.length} inputs vs. python)`)
  errors.forEach((e) => console.log(`    error: ${e}`))
  warnings.forEach((w) => console.log(`    warn:  ${w}`))
}

process.exit(failed ? 1 : 0)
