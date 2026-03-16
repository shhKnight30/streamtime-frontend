// store/services/commentApi.js
import { baseApi } from './baseApi.js';

export const commentApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        getComments: builder.query({
            query: ({ parentContentType, parentContentId, page = 1, limit = 10 }) => ({
                url: '/comment',  // ← GET /api/v1/comment
                method: 'GET',
                params: { parentContentType, parentContentId, page, limit },
            }),
            providesTags: (result, error, { parentContentId }) => [
                { type: 'Comment', id: parentContentId }
            ],
        }),

        addComment: builder.mutation({
            query: ({ content, parentContentType, parentContentId }) => ({
                url: '/comment/add',
                method: 'POST',
                data: { content, parentContentType, parentContentId },
            }),
            invalidatesTags: (result, error, { parentContentId }) => [
                { type: 'Comment', id: parentContentId }
            ],
        }),

        updateComment: builder.mutation({
            query: ({ commentId, content }) => ({
                url: `/comment/${commentId}`,
                method: 'PATCH',
                data: { commentId, content },
            }),
            invalidatesTags: ['Comment'],
        }),

        deleteComment: builder.mutation({
            query: (commentId) => ({
                url: `/comment/${commentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Comment'],
        }),
    }),
});

export const {
    useGetCommentsQuery,
    useAddCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
} = commentApi;