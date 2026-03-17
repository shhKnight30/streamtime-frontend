// store/services/liveStreamApi.js
import { baseApi } from './baseApi.js';

export const liveStreamApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        
        // --- Standard CRUD ---
        createLiveStream: builder.mutation({
            query: (data) => ({
                url: '/live-stream/create',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['LiveStream'],
        }),

        getLiveStreams: builder.query({
            query: (params) => ({
                url: '/live-stream',
                method: 'GET',
                params,
            }),
            providesTags: ['LiveStream'],
        }),

        getLiveStreamById: builder.query({
            query: (streamId) => ({
                url: `/live-stream/${streamId}`,
                method: 'GET',
            }),
            providesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }],
        }),

        updateLiveStream: builder.mutation({
            query: ({ streamId, ...data }) => ({
                url: `/live-stream/${streamId}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { streamId }) => [{ type: 'LiveStream', id: streamId }, 'LiveStream'],
        }),

        deleteLiveStream: builder.mutation({
            query: (streamId) => ({
                url: `/live-stream/${streamId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['LiveStream'],
        }),

        // --- Stream Controls (RTMP/HLS) ---
        startLiveStream: builder.mutation({
            query: (streamId) => ({
                url: `/live-stream/${streamId}/start`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }, 'LiveStream'],
        }),

        stopLiveStream: builder.mutation({
            query: (streamId) => ({
                url: `/live-stream/${streamId}/stop`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }, 'LiveStream'],
        }),

        // --- WebRTC Specific Controls ---
        startWebRTCStream: builder.mutation({
            query: (streamId) => ({
                url: `/live-stream/${streamId}/start-webrtc`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }],
        }),

        stopWebRTCStream: builder.mutation({
            query: (streamId) => ({
                url: `/live-stream/${streamId}/stop-webrtc`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, streamId) => [{ type: 'LiveStream', id: streamId }],
        }),

        getActiveWebRTCStreams: builder.query({
            query: (params) => ({
                url: '/live-stream/webrtc/active',
                method: 'GET',
                params,
            }),
            providesTags: ['LiveStream'],
        }),

        getWebRTCStats: builder.query({
            query: () => ({
                url: '/live-stream/webrtc/stats',
                method: 'GET',
            }),
        }),

        getWebRTCStreamInfo: builder.query({
            query: (streamId) => ({
                url: `/live-stream/${streamId}/webrtc-info`,
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useCreateLiveStreamMutation,
    useGetLiveStreamsQuery,
    useGetLiveStreamByIdQuery,
    useUpdateLiveStreamMutation,
    useDeleteLiveStreamMutation,
    useStartLiveStreamMutation,
    useStopLiveStreamMutation,
    useStartWebRTCStreamMutation,
    useStopWebRTCStreamMutation,
    useGetActiveWebRTCStreamsQuery,
    useGetWebRTCStatsQuery,
    useGetWebRTCStreamInfoQuery,
} = liveStreamApi;