// store/services/videoApi.js
import { baseApi } from './baseApi.js';

export const videoApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getAllVideos: builder.query({
            query: (params) => ({
                url: '/videos',
                method: 'GET',
                params,  // passes page, limit, category, tags as-is
            }),
            keepUnusedDataFor: 60,
            providesTags: ['Video'],
        }),

        // ← Separate search endpoint that uses the correct `q` param
        searchVideos: builder.query({
            query: ({ query, ...rest }) => ({
                url: '/videos/search',
                method: 'GET',
                params: { q: query, ...rest },  // ← was sending `query`, backend expects `q`
            }),
        }),

        getVideoById: builder.query({
            query: (videoId) => ({ url: `/videos/${videoId}`, method: 'GET' }),
        }),

        uploadVideo: builder.mutation({
            query: (formData) => ({
                url: '/videos/upload',
                method: 'POST',
                data: formData,
            }),
            invalidatesTags: ['Video'],
        }),
    }),
});

export const {
    useGetAllVideosQuery,
    useSearchVideosQuery,
    useGetVideoByIdQuery,
    useUploadVideoMutation,
} = videoApi;