// store/services/subscriptionApi.js
import { baseApi } from './baseApi.js';

export const subscriptionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        subscribeToChannel: builder.mutation({
            query: (channelId) => ({
                url: '/subscriptions/subscribe',
                method: 'POST',
                data: { channelId },
            }),
            invalidatesTags: (result, error, channelId) => [
                { type: 'User', id: channelId },
                'Subscription',
            ],
        }),

        unsubscribeFromChannel: builder.mutation({
            query: (channelId) => ({
                url: '/subscriptions/unsubscribe',
                method: 'POST',
                data: { channelId },
            }),
            invalidatesTags: (result, error, channelId) => [
                { type: 'User', id: channelId },
                'Subscription',
            ],
        }),

        checkSubscriptionStatus: builder.query({
            query: (channelId) => ({
                url: `/subscriptions/check/${channelId}`,
                method: 'GET',
            }),
            providesTags: (result, error, channelId) => [
                { type: 'Subscription', id: channelId }
            ],
        }),

        getUserSubscriptions: builder.query({
            query: (params) => ({
                url: '/subscriptions/user/subscriptions',
                method: 'GET',
                params,
            }),
            providesTags: ['Subscription'],
        }),
    }),
});

export const {
    useSubscribeToChannelMutation,
    useUnsubscribeFromChannelMutation,
    useCheckSubscriptionStatusQuery,
    useGetUserSubscriptionsQuery,
} = subscriptionApi;