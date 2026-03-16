import { baseApi } from './baseApi';



export const videoApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getAllVideos: builder.query({

      query: (params) => ({

        url: '/videos', // Adjust to match your Express route (e.g., /videos or /videos/all)

        method: 'GET',

        params, // Useful later for page=1&limit=10 or search queries

      }),

      

      // Keeps the data in cache for 60 seconds

      keepUnusedDataFor: 60,

    }),

    getVideoById: builder.query({

      query: (videoId) => ({

        url: `/videos/${videoId}`,

        method: 'GET',

      }),

    }),



    uploadVideo: builder.mutation({

      query: (formData) => ({

        url: '/videos/upload', // Adjust if your backend uses a different route, like /videos/upload

        method: 'POST',

        data: formData, 

      }),

      // Invalidate the video list so the home feed updates with the new video

      invalidatesTags: ['Video'], 

    }),

  }),

});



export const { useGetAllVideosQuery , useGetVideoByIdQuery , useUploadVideoMutation } = videoApi;