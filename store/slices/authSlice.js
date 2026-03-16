import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isCreator: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      
      if (user) state.user = user;
      if (accessToken) {
        state.accessToken = accessToken;
        state.isAuthenticated = true;
      }
      
      if (user && (user.videos?.length > 0 || user.streams?.length > 0)) {
        state.isCreator = true;
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isCreator = false;
    },
  },
});

export const { setCredentials, logoutUser } = authSlice.actions;
export default authSlice.reducer;