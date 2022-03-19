import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userName: string;
  dataKey: string;
  phoneNumber: string;
  birthdate: string;
  lastName: string;
  address: {
    zip: string;
    country: string;
    state: string;
    line2: string;
    city: string;
    line1: string;
  },
  firstName: string;
  gender: string;
}

const initialState: UserState = {
  userName: '',
  dataKey: 'details',
  phoneNumber: '',
  birthdate: '',
  lastName: '',
  address: {
    zip: '',
    country: '',
    state: '',
    line2: '',
    city: '',
    line1: ''
  },
  firstName: '',
  gender: ''
};

export const userSlice = createSlice({
  name: 'accountSlice',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => state = action.payload
  }
});

export const {
  setUser
} = userSlice.actions;