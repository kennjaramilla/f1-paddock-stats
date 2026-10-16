import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { paddockApi } from './api';
import { preferencesListener } from './preferences';
import { uiSlice } from './uiSlice';

const rootReducer = combineReducers({
  [uiSlice.name]: uiSlice.reducer,
  [paddockApi.reducerPath]: paddockApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** A fresh store per request/tab (App Router guidance: never share a module-level store). */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(preferencesListener.middleware).concat(paddockApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
