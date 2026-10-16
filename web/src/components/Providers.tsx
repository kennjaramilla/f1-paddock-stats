'use client';
import { useEffect, useSyncExternalStore } from 'react';
import type { ThemeName } from '@/lib/colors';
import { PREFS_KEY } from '@/store/preferences';
import { useAppSelector } from '@/store/store';
import { StoreProvider } from './StoreProvider';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');
const subscribeSystemTheme = (cb: () => void) => {
  const mq = darkQuery();
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/** The theme in effect: the user's choice, or the OS preference for 'system'. */
export function useResolvedTheme(): ThemeName {
  const pref = useAppSelector((s) => s.ui.theme);
  const systemDark = useSyncExternalStore(subscribeSystemTheme, () => darkQuery().matches, () => false);
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
}

function ThemeSync() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeSync />
      {children}
    </StoreProvider>
  );
}

/** Runs before paint to avoid a light/dark flash. */
export const themeScript = `try{var t=(JSON.parse(localStorage.getItem('${PREFS_KEY}'))||{}).theme;if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;
