'use client';
import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import { useId, useMemo, useState } from 'react';
import { fmtPoints, shortRace } from '@/lib/format';
import { spreadLabels } from '@/lib/labels';
import { useWidth } from '@/lib/useWidth';

export interface Series {
  id: string;
  label: string;
  name: string;
  team: string;
  color: string;
  dashed: boolean;
  values: number[];
}

interface Props {
  series: Series[];
  roundNames: string[];
  focus: string | null;
  onFocus: (id: string | null) => void;
  height?: number;
  title: string;
}

const M = { top: 16, right: 84, bottom: 34, left: 44 };

export function ProgressionChart({ series, roundNames, focus, onFocus, height = 420, title }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hoverRound, setHoverRound] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const descId = useId();
  const n = roundNames.length;
  const compact = width < 560;
  const m = compact ? { ...M, right: 64, left: 36 } : M;
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  const max = Math.max(1, ...series.map((s) => s.values[s.values.length - 1] ?? 0));
  const x = useMemo(() => scaleLinear().domain([0, Math.max(1, n - 1)]).range([0, innerW]), [n, innerW]);
  const y = useMemo(() => scaleLinear().domain([0, max]).nice().range([innerH, 0]), [max, innerH]);
  const path = useMemo(() => line<number>().x((_, i) => x(i)).y((v) => y(v)).curve(curveMonotoneX), [x, y]);

  const active = hoverId ?? focus;
  const ordered = [...series].sort((a, b) => (a.id === active ? 1 : b.id === active ? -1 : 0));
  const labels = spreadLabels(
    series.map((s) => ({ s, y: y(s.values[n - 1] ?? 0) })),
    compact ? 13 : 15,
    0,
    innerH,
  );
  const tickEvery = Math.ceil(n / Math.max(4, Math.floor(innerW / 44)));
  const shownRound = hoverRound ?? null;
  const atRound = shownRound == null ? [] : [...series].sort((a, b) => b.values[shownRound] - a.values[shownRound]);

  function locate(clientX: number, clientY: number, rect: DOMRect) {
    const px = clientX - rect.left - m.left;
    const py = clientY - rect.top - m.top;
    const r = Math.max(0, Math.min(n - 1, Math.round(x.invert(px))));
    let best: string | null = null;
    let dist = Infinity;
    for (const s of series) {
      const d = Math.abs(y(s.values[r]) - py);
      if (d < dist) { dist = d; best = s.id; }
    }
    setHoverRound(r);
    setHoverId(dist < 24 ? best : null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const order = [...series].sort((a, b) => b.values[n - 1] - a.values[n - 1]);
    const idx = order.findIndex((s) => s.id === active);
    const r = hoverRound ?? n - 1;
    if (e.key === 'ArrowLeft') setHoverRound(Math.max(0, r - 1));
    else if (e.key === 'ArrowRight') setHoverRound(Math.min(n - 1, r + 1));
    else if (e.key === 'ArrowDown') onFocus(order[(idx + 1) % order.length].id);
    else if (e.key === 'ArrowUp') onFocus(order[(idx - 1 + order.length) % order.length].id);
    else if (e.key === 'Escape') { onFocus(null); setHoverRound(null); }
    else return;
    e.preventDefault();
  }

  const tooltipLeft = shownRound == null ? 0 : m.left + x(shownRound);
  const flip = tooltipLeft > width * 0.6;

  return (
    <div ref={ref} className="relative w-full">
      <p id={descId} className="sr-only">
        Line chart of cumulative points by round for {series.length} entries. Use left and right arrows to move between rounds, up and down to
        highlight an entry, Escape to clear.
      </p>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={title}
        aria-describedby={descId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => locate(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => { setHoverRound(null); setHoverId(null); }}
        onClick={() => hoverId && onFocus(hoverId === focus ? null : hoverId)}
        onBlur={() => setHoverRound(null)}
        className="block touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg"
        data-testid="progression-chart"
      >
        <g transform={`translate(${m.left},${m.top})`}>
          {y.ticks(6).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="var(--chart-grid)" />
              <text x={-8} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular">{t}</text>
            </g>
          ))}
          {roundNames.map((_, i) =>
            i % tickEvery === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={innerH + 20} textAnchor="middle" className="fill-ink-3 text-[11px] tabular">
                R{i + 1}
              </text>
            ) : null,
          )}
          {shownRound != null && <line x1={x(shownRound)} x2={x(shownRound)} y2={innerH} stroke="var(--line-strong)" strokeDasharray="3 3" />}
          {ordered.map((s) => {
            const dim = active != null && s.id !== active;
            return (
              <path
                key={s.id}
                d={path(s.values) ?? ''}
                fill="none"
                stroke={s.color}
                strokeWidth={s.id === active ? 3.5 : 2}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                strokeLinecap="round"
                opacity={dim ? 0.18 : 1}
                style={{ transition: 'opacity 150ms' }}
                data-series={s.id}
              />
            );
          })}
          {shownRound != null &&
            series.map((s) => (
              <circle key={s.id} cx={x(shownRound)} cy={y(s.values[shownRound])} r={s.id === active ? 4.5 : 3} fill={s.color}
                stroke="var(--chart-bg)" strokeWidth={1.5} opacity={active != null && s.id !== active ? 0.25 : 1} />
            ))}
          {labels.map(({ s, labelY, y: ly }) => {
            const dim = active != null && s.id !== active;
            return (
              <g key={s.id} transform={`translate(${innerW + 6},0)`} opacity={dim ? 0.3 : 1} className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onFocus(s.id === focus ? null : s.id); }}>
                {Math.abs(labelY - ly) > 2 && <path d={`M0,${ly} L4,${labelY}`} stroke={s.color} />}
                <text x={6} y={labelY} dy="0.32em" className="text-[11px] font-semibold tabular" fill={s.color}>
                  {s.label}
                  <tspan className="fill-ink-2 font-normal"> {fmtPoints(s.values[n - 1] ?? 0)}</tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {shownRound != null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-line bg-surface/95 p-3 text-xs shadow-lg backdrop-blur"
          style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
          aria-hidden
        >
          <div className="mb-1.5 font-semibold text-ink">
            R{shownRound + 1} · {shortRace(roundNames[shownRound])}
          </div>
          <ol className="space-y-0.5">
            {atRound.slice(0, 8).map((s, i) => (
              <li key={s.id} className={`flex items-center gap-2 tabular ${active && s.id !== active ? 'opacity-60' : ''}`}>
                <span className="w-4 text-ink-3">{i + 1}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="font-medium">{s.label}</span>
                <span className="ml-auto">{fmtPoints(s.values[shownRound])}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {shownRound != null &&
          `Round ${shownRound + 1}, ${shortRace(roundNames[shownRound])}: ` +
            atRound.slice(0, 3).map((s) => `${s.name} ${fmtPoints(s.values[shownRound])}`).join(', ')}
      </div>
    </div>
  );
}
