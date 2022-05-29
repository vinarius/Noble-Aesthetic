import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  username: string;
  dataKey: string;
  phoneNumber: string;
  birthdate: string;
  lastName: string;
  zip: string;
  country: string;
  state: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  firstName: string;
  gender: string;
}

const initialState: UserState = {
  username: '',
  dataKey: 'details',
  phoneNumber: '',
  birthdate: '',
  lastName: '',
  zip: '',
  country: '',
  state: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
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