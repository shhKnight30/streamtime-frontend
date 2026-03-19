import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

const defaultHeaders = { 'ngrok-skip-browser-warning': 'true' };

export const axiosBaseQuery = () =>
    async ({ url, method, data, params, headers }, { getState, dispatch }) => {
        try {
            const token = getState().auth.accessToken;
            if (token && token !== 'persisted') {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                delete axiosInstance.defaults.headers.common['Authorization'];
            }

            const result = await axiosInstance({
                url,
                method,
                data,
                params,
                headers: { ...defaultHeaders, ...headers },
                onUploadProgress: (event) => {
                    if (data?.onUploadProgress) {
                        data.onUploadProgress(
                            Math.round((event.loaded * 100) / event.total)
                        );
                    }
                },
            });

            return { data: result.data };

        } catch (axiosError) {
            if (axiosError.response?.status === 401) {

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(async (newToken) => {
                            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                            const retry = await axiosInstance({
                                url, method, data, params,
                                headers: { ...defaultHeaders, ...headers },
                            });
                            return { data: retry.data };
                        })
                        .catch(() => ({
                            error: { status: 401, data: 'Session expired' },
                        }));
                }

                isRefreshing = true;

                try {
                    const refreshResult = await axiosInstance.post(
                        '/users/refresh-token',
                        {},
                        { headers: defaultHeaders }
                    );

                    if (refreshResult.data?.data?.accessToken) {
                        const newToken = refreshResult.data.data.accessToken;
                        const { setCredentials } = await import('@/store/slices/authSlice');
                        dispatch(setCredentials({ accessToken: newToken }));
                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                        processQueue(null, newToken);

                        const retry = await axiosInstance({
                            url, method, data, params,
                            headers: { ...defaultHeaders, ...headers },
                        });
                        return { data: retry.data };
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    const { logoutUser } = await import('@/store/slices/authSlice');
                    dispatch(logoutUser());
                } finally {
                    isRefreshing = false;
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