// store/services/userApi.js
import { baseApi } from './baseApi.js';

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCurrentUser: builder.query({
            query: () => ({ url: '/users/current-user', method: 'GET' }),
            providesTags: ['User'],
        }),

        getChannelProfile: builder.query({
            query: (username) => ({
                url: `/users/channel/${username}`,
                method: 'GET',
            }),
            providesTags: (result, error, username) => [{ type: 'User', id: username }],
        }),

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
                url: '/users/update-profile',
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

        // ✅ ADDED: Update cover image mutation
        updateCoverImage: builder.mutation({
            query: (formData) => ({
                url: '/users/cover-image',
                method: 'PATCH',
                data: formData, // Sends as multipart/form-data
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

        // ✅ ADDED: Refresh token mutation (useful if you don't handle it strictly inside axios interceptors)
        refreshToken: builder.mutation({
            query: (data) => ({
                url: '/users/refresh-token',
                method: 'POST',
                data, // Optional payload (e.g. { refreshToken: "..." }) if not using cookies
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
    useUpdateCoverImageMutation, // ✅ Exported new hook
    useChangePasswordMutation,
    useRefreshTokenMutation,     // ✅ Exported new hook
} = userApi;