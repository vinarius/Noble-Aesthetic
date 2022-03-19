import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserGroup } from '../../../models/enums';
import { DateTime } from 'luxon';

interface AuthState {
  isLoggedIn: boolean;
  role?: UserGroup;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  tokenExpiration?: DateTime;
}

interface SetLoginPayload {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  isLoggedIn: boolean;
  RefreshToken: string;
}

const initialState: AuthState = {
  isLoggedIn: false
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<SetLoginPayload>) => {
      state.accessToken = action.payload.AccessToken;
      state.idToken = action.payload.IdToken;
      state.isLoggedIn = action.payload.isLoggedIn;
      state.refreshToken = action.payload.RefreshToken;
      state.tokenExpiration = DateTime.utc().plus({ seconds: action.payload.ExpiresIn });
    }
  }
});

export const {
  setLogin
} = authSlice.actions;