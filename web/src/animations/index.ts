import type { Animation } from '../engine/types'
import { containerWithMostWater } from './containerWithMostWater'
import { courseSchedule } from './courseSchedule'
import { dailyTemperatures } from './dailyTemperatures'
import { firstMissingPositive } from './firstMissingPositive'
import { longestSubstring } from './longestSubstring'
import { numberOfIslands } from './numberOfIslands'

/** Animations keyed by LeetCode problem number. Add a tracer, register it here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ANIMATIONS: Record<number, Animation<any>> = {
  3: longestSubstring,
  11: containerWithMostWater,
  41: firstMissingPositive,
  200: numberOfIslands,
  207: courseSchedule,
  739: dailyTemperatures,
}
