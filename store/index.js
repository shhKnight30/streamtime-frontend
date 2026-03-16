import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { baseApi } from './services/baseApi';

// // Import all injected endpoint slices here — this forces registration
// import './services/authApi';
// import './services/userApi';
// import './services/videoApi';
// import './services/tweetApi';
// import './services/playlistApi';
// import './services/historyApi';
// import './services/commentApi';
// import './services/dashboardApi';
// import './services/subscriptionApi';   // ← new
// import './services/likeApi';           // ← new

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});