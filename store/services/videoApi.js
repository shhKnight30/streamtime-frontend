// store/services/videoApi.js
import { baseApi } from './baseApi.js';

export const videoApi = baseApi.injectEndpoints({
    overrideExisting: true,
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
        updateVideo: builder.mutation({
            query: ({ videoId, formData}) => ({
                url: `/videos/${videoId}`, // or `/videos/${videoId}` depending on your axiosBaseQuery mapping
                method: 'PATCH',
                data:formData, // e.g., { title: "New Title", description: "...", visibility: "public" }
            }),
            invalidatesTags: (result, error, { videoId }) => [
                { type: 'Video', id: videoId },
                'Video'
            ],
        }),
    }),
});

export const {
    useGetAllVideosQuery,
    useSearchVideosQuery,
    useGetVideoByIdQuery,
    useUploadVideoMutation,
    useUpdateVideoMutation,
} = videoApi;