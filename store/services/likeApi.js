// store/services/likeApi.js
import { baseApi } from './baseApi.js';

export const likeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        toggleLike: builder.mutation({
            query: ({ contentId, contentType }) => ({
                url: '/likes/toggle',
                method: 'POST',
                data: { contentId, contentType },
            }),
            invalidatesTags: (result, error, { contentId }) => [
                { type: 'Like', id: contentId },
                'Video',
                'Tweet',
            ],
        }),

        getLikesCount: builder.query({
            query: ({ contentId, contentType }) => ({
                url: '/likes',
                method: 'GET',
                params: { contentId, contentType },
            }),
            providesTags: (result, error, { contentId }) => [
                { type: 'Like', id: contentId }
            ],
        }),

        checkIsLiked: builder.query({
            query: ({ contentId, contentType }) => ({
                url: '/likes/check',
                method: 'GET',
                params: { contentId, contentType },
            }),
            providesTags: (result, error, { contentId }) => [
                { type: 'Like', id: contentId }
            ],
        }),

        getUserLikes: builder.query({
            query: (params) => ({
                url: '/likes/user',
                method: 'GET',
                params,
            }),
            providesTags: ['Like'],
        }),
    }),
});

export const {
    useToggleLikeMutation,
    useGetLikesCountQuery,
    useCheckIsLikedQuery,
    useGetUserLikesQuery,
} = likeApi;