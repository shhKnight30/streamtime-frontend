import { baseApi } from './baseApi';



export const dashboardApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getDashboardStats: builder.query({

      query: () => ({

        url: '/dashboard/stats', // Adjust to match your backend route

        method: 'GET',

      }),

      providesTags: ['Video', 'User'],

    }),

    getDashboardVideos: builder.query({

      query: () => ({

        url: '/dashboard/videos', // Adjust to match your backend route

        method: 'GET',

      }),

      providesTags: ['Video'],

    }),

    deleteVideo: builder.mutation({

      query: (videoId) => ({

        url: `/videos/${videoId}`,

        method: 'DELETE',

      }),

      invalidatesTags: ['Video'], // Refreshes the table automatically

    }),

  }),

});



export const { 

  useGetDashboardStatsQuery, 

  useGetDashboardVideosQuery,

  useDeleteVideoMutation

} = dashboardApi;