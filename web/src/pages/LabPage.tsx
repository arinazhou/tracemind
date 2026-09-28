import { useState } from 'react'
import { CodeTracer } from '../components/CodeTracer'
import { EXAMPLES, PATTERNS, PROBLEMS } from '../learn'
import { loadDraft, saveDraft, type LabDraft } from '../lab/labDraft'

const STARTER: LabDraft = { ...EXAMPLES['hashing'], args: EXAMPLES['hashing']?.args ?? '', driver: '' }

export function LabPage() {
  const [draft, setDraft] = useState<LabDraft>(() => loadDraft() ?? STARTER)
  const [version, setVersion] = useState(0) // remount the tracer when an example is loaded
  const change = (d: LabDraft) => { setDraft(d); saveDraft(d) }

  const load = (patternId: string) => {
    const ex = EXAMPLES[patternId]
    if (!ex) return
    change({ code: ex.code, args: ex.args ?? '', driver: ex.driver ?? '' })
    setVersion((v) => v + 1)
  }

  return (
    <div className="lesson">
      <div className="eyebrow">Tools</div>
      <h1 className="page-title">Code Lab</h1>
      <p className="lede">
        Paste any Python solution, give it arguments, and watch it run line by line: variables, arrays with index
        pointers, dicts, stacks and queues, grids, trees and linked lists. <b>⚡ Big-O</b> explains its time and space
        complexity. Nothing is sent anywhere, because Python runs inside your browser.
      </p>
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <label className="muted" style={{ fontSize: 13.5, fontWeight: 700 }}>Load a lesson example:</label>
        <select className="lab-select" value="" onChange={(e) => load(e.target.value)}>
          <option value="" disabled>choose a pattern…</option>
          {PATTERNS.filter((p) => EXAMPLES[p.id]).map((p) => (
            <option key={p.id} value={p.id}>{p.title}: {EXAMPLES[p.id].num}. {PROBLEMS.get(EXAMPLES[p.id].num)?.problem.title}</option>
          ))}
        </select>
      </div>
      <CodeTracer
        key={version}
        code={draft.code}
        onCodeChange={(code) => change({ ...draft, code })}
        args={draft.args}
        driver={draft.driver || undefined}
      />
    </div>
  )
}
