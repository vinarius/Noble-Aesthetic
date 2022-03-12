import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isLoggedIn: boolean;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  tokenExpiration?: Date;
}

const initialState: AuthState = {
  isLoggedIn: false
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    
  }
});

export const {
  
} = authSlice.actions;