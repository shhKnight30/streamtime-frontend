// store/services/historyApi.js
import { baseApi } from './baseApi.js';

export const historyApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getWatchHistory: builder.query({
            query: (params) => ({
                url: '/users/history',  // ← route now exists in backend
                method: 'GET',
                params,
            }),
            providesTags: ['User'],
        }),

        clearWatchHistory: builder.mutation({
            query: () => ({
                url: '/users/history/clear',  // ← route now exists
                method: 'PATCH',
            }),
            invalidatesTags: ['User'],
        }),

        getUserComments: builder.query({
            query: (params) => ({
                url: '/comment/user',  // ← was /comments/user/me (wrong path + wrong mount)
                method: 'GET',
                params,
            }),
            providesTags: ['Comment'],
        }),
    }),
});

export const {
    useGetWatchHistoryQuery,
    useClearWatchHistoryMutation,
    useGetUserCommentsQuery,
} = historyApi;