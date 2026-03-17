// store/services/tweetApi.js
import { baseApi } from './baseApi.js';

export const tweetApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        getTweets: builder.query({
            query: (params) => ({
                url: '/tweet/my-tweets',  // ← was /tweets
                method: 'GET',
                params,
            }),
            providesTags: ['Tweet'],
        }),

        getUserTimeline: builder.query({
            query: () => ({
                url: '/tweet/timeline',  // ← was missing entirely
                method: 'GET',
            }),
            providesTags: ['Tweet'],
        }),

        getTweetById: builder.query({
            query: (tweetId) => ({
                url: `/tweet/${tweetId}`,  // ← was /tweets/${id}
                method: 'GET',
            }),
        }),

        createTweet: builder.mutation({
            query: (formData) => ({
                url: '/tweet/create',  // ← was /tweets
                method: 'POST',
                data: formData,  // FormData — supports media uploads
            }),
            invalidatesTags: ['Tweet'],
        }),

        deleteTweet: builder.mutation({
            query: (tweetId) => ({
                url: `/tweet/${tweetId}`,  // ← was /tweets/${id}
                method: 'DELETE',
            }),
            invalidatesTags: ['Tweet'],
        }),

        getMentions: builder.query({
            query: (params) => ({
                url: '/tweet/mentions',
                method: 'GET',
                params,
            }),
        }),

        getTrendingHashtags: builder.query({
            query: (params) => ({
                url: '/tweet/trending',
                method: 'GET',
                params,
            }),
        }),

        getTweetsByHashtag: builder.query({
            query: ({ hashtag, ...params }) => ({
                url: `/tweet/hashtags/${hashtag}`,
                method: 'GET',
                params,
            }),
        }),
    }),
});

export const {
    useGetTweetsQuery,
    useGetUserTimelineQuery,
    useGetTweetByIdQuery,
    useCreateTweetMutation,
    useDeleteTweetMutation,
    useGetMentionsQuery,
    useGetTrendingHashtagsQuery,
    useGetTweetsByHashtagQuery,
} = tweetApi;