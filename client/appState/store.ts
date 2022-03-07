import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { createLogger } from 'redux-logger';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authSlice } from './slices/auth';

import { counterSlice } from './slices/counter';

const middleware = [];

// Logger must be last in middleware chain to properly resolve promises.
if (process.env.NEXT_PUBLIC_STAGE !== 'prod') {
  const logger = createLogger({ collapsed: true });
  middleware.push(logger);
}

const rootReducer = combineReducers({
  counter: counterSlice.reducer,
  auth: authSlice.reducer
});

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage
  },
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;