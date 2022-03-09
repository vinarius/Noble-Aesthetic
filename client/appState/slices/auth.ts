import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Comment {
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
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments = [...state.comments, action.payload];
    },
    removeComment: (state, action: PayloadAction<number>) => {
      state.comments = state.comments.filter(comment => comment.id !== action.payload);
    }
  }
});

export const { addComment, removeComment } = authSlice.actions;