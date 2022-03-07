import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const counterSlice = createSlice({
  name: 'myCounterSlice',
  initialState: {
    count: 0
  },
  reducers: {
    decrement: state => { state.count-- },
    increment: state => { state.count++ },
    incrementByAmount: (state, action: PayloadAction<number>) => { state.count += action.payload }
  }
});

export const { decrement, increment, incrementByAmount } = counterSlice.actions;