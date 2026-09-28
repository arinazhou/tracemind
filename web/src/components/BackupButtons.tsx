import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../data/progress'

/** Download / restore all progress as a JSON file: the backup when the browser is the only copy. */
export function BackupButtons() {
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `tracemind-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup downloaded.')
  }

  const restore = async (file: File) => {
    try {
      const n = importBackup(await file.text())
      setMsg(`Restored ${n} problem${n === 1 ? '' : 's'}.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'That file could not be read.')
    }
  }

  return (
    <div className="backup">
      <button onClick={download}>Back up</button>
      <span>·</span>
      <button onClick={() => input.current?.click()}>Restore</button>
      <input
        ref={input} type="file" accept="application/json,.json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = '' }}
      />
      {msg && <div className="backup-msg">{msg}</div>}
    </div>
  )
}
