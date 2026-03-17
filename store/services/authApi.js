// store/services/authApi.js — add logout endpoint

import { baseApi } from "./baseApi.js";
export const authApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/users/login',
                method: 'POST',
                data: credentials,
            }),
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: '/users/register',
                method: 'POST',
                data: userData,
            }),
        }),
        // ← ADD THIS
        logout: builder.mutation({
            query: () => ({
                url: '/users/logout',
                method: 'POST',
            }),
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;