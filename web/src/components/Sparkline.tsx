import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';

export function Sparkline({ series, width = 220, height = 56, label }: {
  series: { id: string; color: string; values: number[]; dashed?: boolean }[]; width?: number; height?: number; label: string;
}) {
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = scaleLinear().domain([0, n - 1]).range([2, width - 2]);
  const y = scaleLinear().domain([0, max]).range([height - 2, 2]);
  const path = line<number>().x((_, i) => x(i)).y((v) => y(v)).curve(curveMonotoneX);
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className="block">
      {[...series].reverse().map((s) => (
        <path key={s.id} d={path(s.values) ?? ''} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke"
          strokeDasharray={s.dashed ? '5 3' : undefined} strokeLinecap="round" />
      ))}
    </svg>
  );
}
