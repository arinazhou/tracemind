// Plain-language help for the Code Visualizer: sample arguments and error explanations.

const SAMPLES: [RegExp, string][] = [
  [/^(root|tree|root1|root2|subroot)$/i, 'tree([3, 9, 20, None, None, 15, 7])'],
  [/^(head|l1|l2|list1|list2|headA|headB)$/i, 'linked([1, 2, 3, 4])'],
  [/^(grid|board|matrix|mat|image|isconnected)$/i, '[[1, 1, 0], [0, 1, 0], [0, 0, 1]]'],
  [/^(intervals|meetings|points|firstlist|secondlist)$/i, '[[1, 3], [2, 6], [8, 10]]'],
  [/^(edges|prerequisites|connections|pairs)$/i, '[[1, 0], [2, 1], [3, 2]]'],
  [/^(times|flights)$/i, '[[2, 1, 1], [2, 3, 1], [3, 4, 1]]'],
  [/^(words|strs|wordlist|worddict|tokens|emails)$/i, '["eat", "tea", "tan", "ate"]'],
  [/^(s|text|string|str|word|pattern|p|t|digits|num|path)$/i, '"abcabcbb"'],
  [/^(target|sum|targetsum)$/i, '9'],
  [/^(k|numcourses|n|m|x|amount|capacity|days|h|val|key|limit|threshold)$/i, '3'],
  [/(nums|arr|array|numbers|height|heights|prices|temperatures|piles|weights|candidates|coins|stones|cost|gas|ratings|values|list)/i, '[2, 7, 11, 15]'],
]

/** Guess runnable sample arguments from parameter names: (nums, target) → "[2, 7, 11, 15], 9". */
export function sampleArgs(params: string): string {
  const names = params.split(',').map((p) => p.trim()).filter(Boolean)
  return names.map((n) => SAMPLES.find(([re]) => re.test(n))?.[1] ?? '1').join(', ')
}

/** Turn a raw Python error into what to do next. */
export function explainError(raw: string, mode: 'script' | 'call' | 'driver'): string {
  let m: RegExpMatchArray | null
  if ((m = raw.match(/missing (\d+) required positional argument/)))
    return `Your function needs ${m[1] === '1' ? 'another argument' : `${m[1]} more arguments`}. Type them in step ② (the box after the function name).`
  if ((m = raw.match(/takes (\d+) positional arguments? but (\d+) (were|was) given/)))
    return `Too many arguments: the function takes ${Number(m[1]) - 1} but got ${Number(m[2]) - 1}. Check the commas in step ②.`
  if ((m = raw.match(/NameError: name '(\w+)' is not defined/)))
    return m[1] === 'Solution'
      ? 'There is no class Solution in your code. For a plain program, switch step ② to "Run as a script".'
      : `\`${m[1]}\` is used before it exists. Check the spelling, or define/import it first${mode === 'call' ? ' (arguments in step ② are Python, so text needs "quotes")' : ''}.`
  if (/IndentationError|unindent|expected an indented block/.test(raw))
    return 'The indentation is off. Python blocks need consistent spaces (4 per level). Tab in the editor inserts 4 spaces.'
  if (/Syntax error/.test(raw)) return `${raw}. Look at that line (and the one before it) for a missing colon, bracket or quote.`
  if (/No class or function found/.test(raw))
    return 'There is nothing to call: no function or class Solution. If this is a plain program, switch step ② to "Run as a script".'
  if (/ran longer than/.test(raw)) return 'It ran for more than 8 seconds and was stopped. Probably an infinite loop, or an input that is too big to animate.'
  if ((m = raw.match(/^(\w+Error): (.*)$/))) return `Your code raised ${m[1]}: ${m[2]}. The steps below lead up to it: step back to see the values that caused it.`
  return raw
}
