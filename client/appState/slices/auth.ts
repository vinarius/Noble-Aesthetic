import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

interface AuthState {
  comments: Comment[];
}

const initialState: AuthState = {
  comments: []
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    getComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = [...state.comments, ...action.payload]
    }
  }
});
