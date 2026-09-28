import { STATUSES, update, useProgress, type Status } from '../data/progress'

export function StatusSelect({ num }: { num: number }) {
  const progress = useProgress()
  const status = progress[num]?.status ?? 'todo'
  return (
    <select
      className={`status-select st-${status}`}
      value={status}
      onChange={(e) => update(num, { status: e.target.value as Status })}
      aria-label="Status"
    >
      {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  )
}
