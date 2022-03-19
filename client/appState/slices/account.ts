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

interface SetAuthTokensPayload {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  RefreshToken: string;
}

const initialState: AuthState = {
  isLoggedIn: false
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    setAuthTokens: (state, action: PayloadAction<SetAuthTokensPayload>) => {
      state.accessToken = action.payload.AccessToken;
      state.idToken = action.payload.IdToken;
      state.isLoggedIn = true;
      state.refreshToken = action.payload.RefreshToken;
      state.tokenExpiration = DateTime.utc().plus({ seconds: action.payload.ExpiresIn });
    }
  }
});

export const {
  setAuthTokens
} = authSlice.actions;