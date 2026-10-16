import { teamColorFor, type ThemeName } from './colors';
import { driverLabel } from './format';
import type { SeasonDetail } from './types';
import type { StandingsView, TopN } from '@/store/uiSlice';

export interface ChartSeries {
  id: string; label: string; name: string; team: string; color: string; dashed: boolean; values: number[];
}

/** Team colour per line; a second car from the same team is dashed so colour is never the only cue. */
export function buildSeries(season: SeasonDetail, state: { view: StandingsView; top: TopN }, theme: ThemeName): ChartSeries[] {
  const limit = state.top === 'all' ? Infinity : Number(state.top);
  const seen = new Map<string, number>();
  const withDash = (team: string) => {
    const count = seen.get(team) ?? 0;
    seen.set(team, count + 1);
    return count > 0;
  };

  if (state.view === 'constructors') {
    return season.constructors.slice(0, limit).map((c) => ({
      id: c.constructorId, label: c.name, name: c.name, team: c.constructorId,
      color: teamColorFor(c.constructorId, theme), dashed: false, values: c.cumulative,
    }));
  }
  return season.drivers.slice(0, limit).map((d) => ({
    id: d.driverId, label: driverLabel(d), name: d.name, team: d.constructorId,
    color: teamColorFor(d.constructorId, theme), dashed: withDash(d.constructorId), values: d.cumulative,
  }));
}
