import { fmtPoints, shortRace } from '@/lib/format';
import type { ChartSeries } from '@/lib/series';

/** Accessible tabular alternative to the progression chart. */
export function CumulativeTable({ series, roundNames }: { series: ChartSeries[]; roundNames: string[] }) {
  return (
    <div className="max-h-[480px] overflow-auto rounded-lg border border-line" tabIndex={0} role="region" aria-label="Cumulative points table">
      <table className="text-sm tabular">
        <caption className="sr-only">Cumulative points after each round</caption>
        <thead className="sticky top-0 z-10 bg-surface-2">
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left">Entry</th>
            {roundNames.map((r, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-ink-3" title={r}>
                R{i + 1}<span className="sr-only"> {shortRace(r)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.id} className="border-t border-line">
              <th scope="row" className="sticky left-0 bg-surface px-3 py-1.5 text-left font-medium whitespace-nowrap">
                <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </th>
              {s.values.map((v, i) => (
                <td key={i} className="px-2 py-1.5 text-right">{fmtPoints(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
