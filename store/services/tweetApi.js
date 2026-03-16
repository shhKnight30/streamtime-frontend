import { baseApi } from './baseApi';



export const tweetApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getTweets: builder.query({

      query: () => ({

        url: '/tweets', // Adjust to match your Express backend route

        method: 'GET',

      }),

      providesTags: ['Tweet'],

    }),

    getUserTweets: builder.query({

      query: (userId) => ({

        url: `/tweets/user/${userId}`,

        method: 'GET',

      }),

      providesTags: ['Tweet'],

    }),

    createTweet: builder.mutation({

      query: (content) => ({

        url: '/tweets',

        method: 'POST',

        data: { content },

      }),

      invalidatesTags: ['Tweet'], // Refreshes the feed automatically

    }),

    deleteTweet: builder.mutation({

      query: (tweetId) => ({

        url: `/tweets/${tweetId}`,

        method: 'DELETE',

      }),

      invalidatesTags: ['Tweet'],

    }),

  }),

});



export const { 

  useGetTweetsQuery, 

  useGetUserTweetsQuery, 

  useCreateTweetMutation, 

  useDeleteTweetMutation 

} = tweetApi;