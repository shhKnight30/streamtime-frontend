// store/services/baseApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: axiosBaseQuery({ baseUrl: '' }),  // ← was process.env.NEXT_PUBLIC_API_URL (caused double URL)
    tagTypes: ['Video', 'User', 'Playlist', 'Tweet', 'Comment', 'Like', 'Subscription','LiveStream'],
    endpoints: () => ({}),
});