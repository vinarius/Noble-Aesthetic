import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserGroup } from '../../../models/enums';

interface AuthState {
  isLoggedIn: boolean;
  role?: UserGroup;
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