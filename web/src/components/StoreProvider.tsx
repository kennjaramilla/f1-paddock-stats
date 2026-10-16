'use client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { readPreferences } from '@/store/preferences';
import { makeStore } from '@/store/store';
import { preferencesLoaded } from '@/store/uiSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  // Loaded after mount so the server render and the first client render agree.
  useEffect(() => {
    store.dispatch(preferencesLoaded(readPreferences()));
  }, [store]);
  return <Provider store={store}>{children}</Provider>;
}
