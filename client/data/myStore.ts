import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'myCounterSlice',
  initialState: {
    count: 0
  },
  reducers: {
    increment: state => { state.count += 1 },
    decrement: state => { state.count += 1 },
    incrementByAmount: (state, action: PayloadAction<number>) => { state.count += action.payload }
  }
});

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;