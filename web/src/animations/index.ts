import type { Animation } from '../engine/types'
import { containerWithMostWater } from './containerWithMostWater'
import { courseSchedule } from './courseSchedule'
import { dailyTemperatures } from './dailyTemperatures'
import { firstMissingPositive } from './firstMissingPositive'
import { longestSubstring } from './longestSubstring'
import { numberOfIslands } from './numberOfIslands'
import { diameter, levelOrder, maxDepth, validateBST } from './treeTemplates'
import { inorder, postorder, preorder } from './treeTraversals'

/** Animations keyed by LeetCode problem number. Add a tracer, register it here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ANIMATIONS: Record<number, Animation<any>> = {
  3: longestSubstring,
  11: containerWithMostWater,
  41: firstMissingPositive,
  94: inorder,
  98: validateBST,
  102: levelOrder,
  104: maxDepth,
  144: preorder,
  145: postorder,
  200: numberOfIslands,
  543: diameter,
  207: courseSchedule,
  739: dailyTemperatures,
}
