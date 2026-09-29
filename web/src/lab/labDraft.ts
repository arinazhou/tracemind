// The Code Visualizer's working copy, kept in the browser so it survives reloads.
import type { WorkedExample } from '../learn/types'

const KEY = 'tracemind:lab:v1'

export interface LabDraft {
  code: string
  args: string
  driver: string
  stdin?: string
  /** Parameter list the args were typed for (stale args are replaced with samples). */
  argsFor?: string
}

export function loadDraft(): LabDraft | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveDraft(d: LabDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    // private mode / storage full: the lab still works for this visit
  }
}

export function openInLab(ex: Pick<WorkedExample, 'code' | 'args' | 'driver'>) {
  saveDraft({ code: ex.code, args: ex.args ?? '', driver: ex.driver ?? '' })
}
