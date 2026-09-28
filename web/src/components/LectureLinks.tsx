import { CS225_LECTURES_PAGE, slideUrls } from '../learn/dataStructures'

/** CS 225 lectures for a topic: annotated notes first, blank slides second. */
export function LectureLinks({ lectures }: { lectures: [string, string][] }) {
  return (
    <div className="card panel">
      <div className="panel-title">CS 225 lecture notes (Spring 2026)</div>
      <ul className="slide-links">
        {lectures.map(([title, stem]) => {
          const u = slideUrls(stem)
          return (
            <li key={stem}>
              <span className="lecture-title">{title}</span>
              <a className="lc-link" href={u.annotated} target="_blank" rel="noreferrer">annotated notes ↗</a>
              <a className="faint slide-blank" href={u.blank} target="_blank" rel="noreferrer">blank slides</a>
            </li>
          )
        })}
      </ul>
      <p className="faint" style={{ fontSize: 12, margin: '8px 0 0' }}>
        "Annotated" = the slides as written on during lecture. <a className="lc-link" href={CS225_LECTURES_PAGE} target="_blank" rel="noreferrer">All CS 225 lectures ↗</a>
      </p>
    </div>
  )
}
