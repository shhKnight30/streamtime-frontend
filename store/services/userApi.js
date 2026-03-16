// store/services/userApi.js
import { baseApi } from './baseApi.js';

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCurrentUser: builder.query({
            query: () => ({ url: '/users/current-user', method: 'GET' }),
            providesTags: ['User'],
        }),

        // ← Now takes username string, not _id
        getChannelProfile: builder.query({
            query: (username) => ({
                url: `/users/channel/${username}`,  // ← was /users/c/${channelId}
                method: 'GET',
            }),
            providesTags: (result, error, username) => [{ type: 'User', id: username }],
        }),

        // ← For channel page: get videos by owner
        getUserVideos: builder.query({
            query: (params) => ({
                url: '/videos/user',
                method: 'GET',
                params,
            }),
            providesTags: ['Video'],
        }),

        updateAccountDetails: builder.mutation({
            query: (data) => ({
                url: '/users/update-profile',  // ← was /users/update-account
                method: 'PATCH',
                data,
            }),
            invalidatesTags: ['User'],
        }),

        updateAvatar: builder.mutation({
            query: (formData) => ({
                url: '/users/avatar',
                method: 'PATCH',
                data: formData,
            }),
            invalidatesTags: ['User'],
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: '/users/change-password',
                method: 'POST',
                data,
            }),
        }),
    }),
});

export const {
    useGetCurrentUserQuery,
    useGetChannelProfileQuery,
    useGetUserVideosQuery,
    useUpdateAccountDetailsMutation,
    useUpdateAvatarMutation,
    useChangePasswordMutation,
} = userApi;