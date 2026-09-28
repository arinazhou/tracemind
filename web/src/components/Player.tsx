import { useMemo, useState } from 'react'
import type { Animation, Step } from '../engine/types'
import { StepView } from './StepView'

function runTrace(anim: Animation, text: string): { steps: Step[] } | { error: string } {
  try {
    const steps = anim.trace(JSON.parse(text))
    return steps.length ? { steps } : { error: 'The tracer produced no steps.' }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** A hand-written animation (tracer) with an editable JSON input. */
export function Player({ anim, initialStep = 0 }: { anim: Animation; initialStep?: number }) {
  const defaultText = useMemo(() => JSON.stringify(anim.defaultInput), [anim])
  const [text, setText] = useState(defaultText)
  const [result, setResult] = useState(() => runTrace(anim, defaultText))
  const rerun = (t: string) => { setText(t); setResult(runTrace(anim, t)) }

  return (
    <StepView
      code={anim.code}
      steps={'steps' in result ? result.steps : null}
      initialStep={initialStep}
      below={
        <div className="card input-editor">
          <div className="panel-title">Try your own input (JSON)</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => rerun(text)}>Re-run</button>
            <button className="btn" onClick={() => rerun(defaultText)}>Reset example</button>
            <button className="btn" onClick={() => rerun(JSON.stringify(anim.generate(10)))}>Random</button>
          </div>
          {anim.examples && (
            <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
              <span className="faint" style={{ fontSize: 12 }}>Presets:</span>
              {anim.examples.map((e) => (
                <button key={e.label} className="chip" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                  onClick={() => rerun(JSON.stringify(e.input))}>{e.label}</button>
              ))}
            </div>
          )}
          {'error' in result && <p className="error">{result.error}</p>}
        </div>
      }
    />
  )
}
