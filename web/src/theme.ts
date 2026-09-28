/** Pastel tints for a category hue: soft wash, readable ink, and a dot/bar color. */
export function catColors(hue: number) {
  return {
    wash: `hsl(${hue} 70% 95%)`,
    ink: `hsl(${hue} 40% 32%)`,
    dot: `hsl(${hue} 60% 72%)`,
  }
}
