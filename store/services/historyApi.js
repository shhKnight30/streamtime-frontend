import { baseApi } from './baseApi';



export const historyApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getWatchHistory: builder.query({

      query: () => ({

        url: '/users/history', // Adjust to match your Express route

        method: 'GET',

      }),

      providesTags: ['Video', 'User'],

    }),

    getUserComments: builder.query({

      query: () => ({

        url: '/comments/user/me', // Adjust to match your Express route

        method: 'GET',

      }),

      providesTags: ['Comment'],

    }),

    clearWatchHistory: builder.mutation({

      query: () => ({

        url: '/users/history/clear',

        method: 'PATCH',

      }),

      invalidatesTags: ['Video', 'User'],

    }),

  }),

});



export const { 

  useGetWatchHistoryQuery, 

  useGetUserCommentsQuery, 

  useClearWatchHistoryMutation 

} = historyApi;