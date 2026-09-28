import { ANIMATIONS } from '../animations'
import { EXAMPLES, PROBLEMS } from '../learn'
import { update, useProgress } from '../data/progress'
import { CodeTracer } from './CodeTracer'

/** Convert a hand-made animation's JSON input into Python call arguments. */
function argsFromAnimation(num: number): string {
  const anim = ANIMATIONS[num]
  if (!anim) return ''
  const py = (v: unknown): string => {
    if (v === null) return 'None'
    if (v === true) return 'True'
    if (v === false) return 'False'
    if (Array.isArray(v)) return `[${v.map(py).join(', ')}]`
    if (typeof v === 'object' && v && '__tree__' in v) return `tree(${py((v as { __tree__: unknown }).__tree__)})`
    return JSON.stringify(v)
  }
  return anim.pyArgs(anim.defaultInput).map(py).join(', ')
}

export function MySolution({ num }: { num: number }) {
  const code = useProgress()[num]?.solution ?? ''
  const pattern = PROBLEMS.get(num)?.pattern
  const example = pattern && EXAMPLES[pattern.id]?.num === num ? EXAMPLES[pattern.id] : undefined
  const anim = ANIMATIONS[num]

  return (
    <div>
      <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
        Paste your accepted LeetCode solution. It autosaves. <b>Visualize</b> runs it step by step on any input, and <b>Big-O</b> explains its complexity.
        {!code.trim() && anim && (
          <> <button className="hint-btn" onClick={() => update(num, { solution: anim.code })}>Start from the reference solution</button></>
        )}
      </p>
      <CodeTracer
        code={code}
        onCodeChange={(c) => update(num, { solution: c })}
        args={example?.args ?? argsFromAnimation(num)}
        driver={example?.driver}
        scrollOnRun
      />
    </div>
  )
}
