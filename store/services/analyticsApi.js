// store/services/analyticsApi.js
import { baseApi } from './baseApi.js';

export const analyticsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        
        getUserAnalytics: builder.query({
            query: () => ({
                url: '/analytics/user',
                method: 'GET',
            }),
            providesTags: ['User', 'Video'],
        }),

        getVideoAnalytics: builder.query({
            query: (videoId) => ({
                url: `/analytics/video/${videoId}`,
                method: 'GET',
            }),
            providesTags: (result, error, videoId) => [{ type: 'Video', id: videoId }],
        }),

        getLiveStreamAnalytics: builder.query({
            query: (streamId) => ({
                url: `/analytics/stream/${streamId}`,
                method: 'GET',
            }),
            providesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }],
        }),

        updateVideoViews: builder.mutation({
            query: (videoId) => ({
                url: `/analytics/video/${videoId}/views`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, videoId) => [{ type: 'Video', id: videoId }],
        }),
    }),
});

export const {
    useGetUserAnalyticsQuery,
    useGetVideoAnalyticsQuery,
    useGetLiveStreamAnalyticsQuery,
    useUpdateVideoViewsMutation,
} = analyticsApi;