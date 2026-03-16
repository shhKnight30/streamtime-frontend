// store/slices/authSlice.js
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
            const { user, accessToken, isAuthenticated } = action.payload;

            if (user) state.user = user;

            if (accessToken) {
                state.accessToken = accessToken;
                state.isAuthenticated = true;
            }

            // Handle the cookie-based auth flow where we only set isAuthenticated
            if (isAuthenticated === true) {
                state.isAuthenticated = true;
            }

            // isCreator: anyone with an account can upload videos
            // The dashboard link should show for all authenticated users
            if (state.isAuthenticated) {
                state.isCreator = true;  // ← was checking user.videos which doesn't exist
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