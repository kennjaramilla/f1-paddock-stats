// Constructor colours (approximate livery tones; not official assets).
const TEAM_COLORS: Record<string, string> = {
  mercedes: '#00a19c', red_bull: '#3671c6', ferrari: '#e8002d', mclaren: '#ff8000', aston_martin: '#229971',
  alpine: '#0093cc', williams: '#1868db', rb: '#6692ff', alphatauri: '#2b4562', toro_rosso: '#469bff',
  sauber: '#52e252', alfa: '#a6051a', haas: '#8c8f93', racing_point: '#f596c8', force_india: '#f596c8',
  renault: '#ffd800', lotus_f1: '#b5953a', manor: '#ed1c24', marussia: '#6e0000', caterham: '#005030',
  audi: '#bb0a30', cadillac: '#1e2a3a',
};

const FALLBACK = ['#7c3aed', '#0891b2', '#ca8a04', '#be185d', '#4d7c0f', '#c2410c'];

export function teamColor(constructorId: string): string {
  if (TEAM_COLORS[constructorId]) return TEAM_COLORS[constructorId];
  let h = 0;
  for (const ch of constructorId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Darkens (on light bg) or lightens (on dark bg) a colour until it reaches the target contrast ratio. */
export function ensureContrast(fg: string, bg: string, target = 3): string {
  if (contrast(fg, bg) >= target) return fg.toLowerCase();
  const towardWhite = luminance(bg) < 0.5;
  const [r, g, b] = hexToRgb(fg);
  for (let t = 0.05; t <= 1; t += 0.05) {
    const mix = towardWhite ? [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t] : [r * (1 - t), g * (1 - t), b * (1 - t)];
    const hex = toHex(mix);
    if (contrast(hex, bg) >= target) return hex;
  }
  return towardWhite ? '#ffffff' : '#000000';
}

export const THEME_BG = { light: '#ffffff', dark: '#16171c' } as const;
export type ThemeName = keyof typeof THEME_BG;

export const teamColorFor = (constructorId: string, theme: ThemeName) => ensureContrast(teamColor(constructorId), THEME_BG[theme], 3);
