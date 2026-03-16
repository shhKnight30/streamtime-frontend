import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/users/login', // Adjust this to match your Express backend route
        method: 'POST',
        data: credentials,   // Note: Our custom axios adapter uses 'data', not 'body'
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/users/register', // Adjust this to match your Express backend route
        method: 'POST',
        data: userData,
        // If your backend expects FormData for an avatar upload, we can adjust this later
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;