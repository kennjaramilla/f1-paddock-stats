import { describe, expect, it } from 'vitest';
import { buildQuery, parseCompareState, parseEnum, parseId, parseIntParam } from './url-state';

describe('parsers', () => {
  it('parseEnum falls back on unknown values', () => {
    expect(parseEnum('table', ['chart', 'table'] as const, 'chart')).toBe('table');
    expect(parseEnum('pie', ['chart', 'table'] as const, 'chart')).toBe('chart');
    expect(parseEnum(null, ['chart'] as const, 'chart')).toBe('chart');
  });

  it('parseIntParam rejects junk and out-of-range values', () => {
    expect(parseIntParam('2021', 0)).toBe(2021);
    expect(parseIntParam('20x', 7)).toBe(7);
    expect(parseIntParam('1999', 7, { min: 2014 })).toBe(7);
  });

  it('parseId only accepts slug ids', () => {
    expect(parseId('max_verstappen')).toBe('max_verstappen');
    expect(parseId('<script>')).toBeNull();
    expect(parseId('')).toBeNull();
  });
});

describe('buildQuery', () => {
  it('drops defaults and sorts keys for stable URLs', () => {
    expect(buildQuery('', { sort: 'races', q: 'monza', a: 'x' }, { sort: 'races' })).toBe('?a=x&q=monza');
  });

  it('removes keys set to null or empty and keeps others', () => {
    expect(buildQuery('?b=rosberg&a=hamilton', { b: null })).toBe('?a=hamilton');
    expect(buildQuery('?q=it', { q: '' })).toBe('');
  });
});

describe('compare state', () => {
  const bounds = { min: 2014, max: 2026 };

  it('parses drivers and a season range', () => {
    expect(parseCompareState(new URLSearchParams('a=hamilton&b=rosberg&from=2014&to=2016'), bounds)).toEqual({ a: 'hamilton', b: 'rosberg', from: 2014, to: 2016 });
  });

  it('swaps an inverted range and ignores out-of-bounds years', () => {
    expect(parseCompareState(new URLSearchParams('from=2020&to=2015'), bounds)).toMatchObject({ from: 2015, to: 2020 });
    expect(parseCompareState(new URLSearchParams('from=1990'), bounds)).toMatchObject({ from: null, to: null });
  });
});
