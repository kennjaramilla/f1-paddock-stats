import { describe, expect, it } from 'vitest';
import { THEME_BG, contrast, ensureContrast, teamColor, teamColorFor } from './colors';

describe('team colours', () => {
  it('uses known colours and a stable fallback for unknown teams', () => {
    expect(teamColor('ferrari')).toBe('#e8002d');
    expect(teamColor('brand_new_team')).toBe(teamColor('brand_new_team'));
  });

  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('darkens pale colours on light backgrounds and lightens dark ones on dark', () => {
    const renaultLight = teamColorFor('renault', 'light');
    expect(contrast(renaultLight, THEME_BG.light)).toBeGreaterThanOrEqual(3);
    const alphaDark = teamColorFor('alphatauri', 'dark');
    expect(contrast(alphaDark, THEME_BG.dark)).toBeGreaterThanOrEqual(3);
  });

  it('leaves colours that already pass untouched', () => {
    expect(ensureContrast('#E8002D', '#ffffff')).toBe('#e8002d');
  });
});
