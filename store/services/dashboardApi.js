// store/services/dashboardApi.js  — no URL changes needed, backend now has these routes
import { baseApi } from './baseApi.js';

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getDashboardStats: builder.query({
            query: () => ({ url: '/dashboard/stats', method: 'GET' }),
            providesTags: ['Video', 'User'],
        }),

        getDashboardVideos: builder.query({
            query: (params) => ({ url: '/dashboard/videos', method: 'GET', params }),
            providesTags: ['Video'],
        }),

        deleteVideo: builder.mutation({
            query: (videoId) => ({ url: `/videos/${videoId}`, method: 'DELETE' }),
            invalidatesTags: ['Video'],
        }),
    }),
});

export const {
    useGetDashboardStatsQuery,
    useGetDashboardVideosQuery,
    useDeleteVideoMutation,
} = dashboardApi;