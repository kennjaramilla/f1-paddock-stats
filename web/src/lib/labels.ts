/** Spreads end-of-line labels vertically so they never overlap; keeps order, stays within bounds. */
export function spreadLabels<T extends { y: number }>(items: T[], minGap: number, top: number, bottom: number): (T & { labelY: number })[] {
  const sorted = [...items].sort((a, b) => a.y - b.y).map((i) => ({ ...i, labelY: i.y }));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].labelY - sorted[i - 1].labelY < minGap) sorted[i].labelY = sorted[i - 1].labelY + minGap;
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].labelY - bottom : 0;
  if (overflow > 0) {
    sorted[sorted.length - 1].labelY -= overflow;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i + 1].labelY - sorted[i].labelY < minGap) sorted[i].labelY = sorted[i + 1].labelY - minGap;
    }
  }
  for (const s of sorted) s.labelY = Math.max(top, s.labelY);
  return sorted;
}
