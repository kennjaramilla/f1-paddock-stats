import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { chartModeChanged, standingsViewChanged, themeChanged, topNChanged, type Preferences } from './uiSlice';
import type { RootState } from './store';

export const PREFS_KEY = 'paddock-prefs';

export function readPreferences(): Partial<Preferences> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** Side effect (the NgRx "effect"): persist display preferences whenever one changes. */
export const preferencesListener = createListenerMiddleware();

preferencesListener.startListening({
  matcher: isAnyOf(themeChanged, standingsViewChanged, topNChanged, chartModeChanged),
  effect: (_, api) => {
    const { theme, standingsView, topN, chartMode } = (api.getState() as RootState).ui;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, standingsView, topN, chartMode } satisfies Preferences));
    } catch {
      // Storage can be unavailable (private mode); preferences then last for the session.
    }
  },
});
