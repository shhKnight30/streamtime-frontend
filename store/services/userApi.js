import { baseApi } from './baseApi';



export const userApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getChannelProfile: builder.query({

      query: (channelId) => ({

        url: `/users/c/${channelId}`,

        method: 'GET',

      }),

      providesTags: (result, error, id) => [{ type: 'User', id }],

    }),

    

    // ADDED: Mutations for Settings Page

    updateAccountDetails: builder.mutation({

      query: (data) => ({

        url: '/users/update-account', // Adjust to match your Express route

        method: 'PATCH',

        data, 

      }),

      invalidatesTags: ['User'],

    }),

    getCurrentUser: builder.query({

      query: () => ({

        url: '/users/current-user', 

        method: 'GET',

      }),

      providesTags: ['User'],

    }),    

    updateAvatar: builder.mutation({

      query: (formData) => ({

        url: '/users/avatar', // Adjust to match your Express route

        method: 'PATCH',

        data: formData, // FormData for file upload

      }),

      invalidatesTags: ['User'],

    }),

    

    changePassword: builder.mutation({

      query: (data) => ({

        url: '/users/change-password', // Adjust to match your Express route

        method: 'POST',

        data, 

      }),

    }),

  }),

});



export const { 

  useGetChannelProfileQuery,

  useUpdateAccountDetailsMutation,

  useUpdateAvatarMutation,

  useChangePasswordMutation,

  useGetCurrentUserQuery 

} = userApi;