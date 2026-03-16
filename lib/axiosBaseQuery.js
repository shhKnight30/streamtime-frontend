import axios from 'axios';
import { logoutUser, setCredentials } from '@/store/slices/authSlice';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, 
});

export const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params, headers }, { getState, dispatch }) => {
    try {
      const token = getState().auth.accessToken;
      if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
      
    } catch (axiosError) {
      const err = axiosError;
      
      if (err.response?.status === 401) {
        try {
           const refreshResult = await axiosInstance.post('/users/refresh-token');
           
           if (refreshResult.data?.accessToken) {
             const newAccessToken = refreshResult.data.accessToken;
             
             dispatch(setCredentials({ accessToken: newAccessToken }));
             
             axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
             const retryResult = await axiosInstance({
               url: baseUrl + url,
               method,
               data,
               params,
               headers,
             });
             return { data: retryResult.data };
           }
        } catch (refreshError) {
           dispatch(logoutUser());
           return {
             error: {
               status: refreshError.response?.status,
               data: refreshError.response?.data || refreshError.message,
             },
           };
        }
      }

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };