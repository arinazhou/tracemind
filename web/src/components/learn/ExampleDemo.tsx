import type { WorkedExample } from '../../learn/types'
import { PROBLEMS } from '../../learn'
import { openInLab } from '../../lab/labDraft'
import { CodeTracer } from '../CodeTracer'

interface Props {
  example: WorkedExample
  open: boolean
  onToggle: () => void
}

/** A lesson's worked example: real Python, traced line by line when opened. */
export function ExampleDemo({ example, open, onToggle }: Props) {
  const title = PROBLEMS.get(example.num)?.problem.title ?? ''
  return (
    <div className={`demo${open ? ' open' : ''}`}>
      <button className="demo-head" onClick={onToggle} aria-expanded={open}>
        <span className="demo-play">{open ? '▾' : '▶'}</span>
        <span><b>Worked example:</b> {example.num}. {title} <span className="faint">· {example.time}</span></span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <a className="lc-link" href="#/visualize" onClick={(e) => { e.stopPropagation(); openInLab(example) }}>edit in Visualizer →</a>
          <a className="lc-link" href={`#/p/${example.num}`} onClick={(e) => e.stopPropagation()}>problem page →</a>
        </span>
      </button>
      {open && (
        <div className="demo-body">
          <CodeTracer code={example.code} args={example.args} driver={example.driver} autoRun showAnalyze />
        </div>
      )}
    </div>
  )
}
