// lib/axiosBaseQuery.js
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export const axiosBaseQuery =
    ({ baseUrl } = { baseUrl: '' }) =>
    async ({ url, method, data, params, headers }, { getState, dispatch }) => {
        try {
            const token = getState().auth.accessToken;

            if (token && token !== 'persisted') {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                delete axiosInstance.defaults.headers.common['Authorization'];
            }

            const result = await axiosInstance({ url, method, data, params, headers });
            return { data: result.data };

        } catch (axiosError) {
            if (axiosError.response?.status === 401) {
                try {
                    const refreshResult = await axiosInstance.post('/users/refresh-token');

                    if (refreshResult.data?.data?.accessToken) {
                        const newToken = refreshResult.data.data.accessToken;

                        // ← Import lazily at call time, not at module evaluation time
                        // This breaks the circular dependency
                        const { setCredentials } = await import('@/store/slices/authSlice');
                        dispatch(setCredentials({ accessToken: newToken }));

                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                        const retry = await axiosInstance({ url, method, data, params, headers });
                        return { data: retry.data };
                    }
                } catch {
                    const { logoutUser } = await import('@/store/slices/authSlice');
                    dispatch(logoutUser());
                }
            }

            return {
                error: {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data || axiosError.message,
                },
            };
        }
    };