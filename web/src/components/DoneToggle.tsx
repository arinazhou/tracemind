import { update, useProgress } from '../data/progress'

/** The whole tracker, per problem: done ✓ and the date you finished it. */
export function DoneToggle({ num, showDate = true }: { num: number; showDate?: boolean }) {
  const e = useProgress()[num]
  const done = e?.status === 'solved'
  return (
    <span className="done">
      <button
        className={`done-box${done ? ' on' : ''}`}
        onClick={() => update(num, { status: done ? 'todo' : 'solved' })}
        aria-pressed={done}
        title={done ? 'Mark as not done' : 'Mark as done'}
      >
        {done ? '✓' : ''}
      </button>
      {showDate && done && (
        <input
          type="date"
          className="done-date"
          value={e?.solvedAt ?? ''}
          onChange={(ev) => update(num, { solvedAt: ev.target.value })}
          aria-label="Date finished"
        />
      )}
    </span>
  )
}
