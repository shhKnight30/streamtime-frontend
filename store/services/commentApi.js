// import { baseApi } from './baseApi';



// export const commentApi = baseApi.injectEndpoints({
  
//   overrideExisting: true, // Allow overriding existing endpoints

//   endpoints: (builder) => ({
    
//     addComment: builder.mutation({
    
//       query: ({ videoId, content, contentType = 'video' }) => ({
    
//         url: `/comment/add`, // Backend: POST /api/v1/comments/add
    
//         method: 'POST',
    
//         data: { 
//           content,
//           contentType,
//           contentId: videoId 
//         },
    
//       }),
    
//       invalidatesTags: (result, error, { videoId }) => [{ type: 'Comment', id: videoId }],
    
//     }),
//     getVideoComments: builder.query({
      
//       query: (videoId) => ({
        
//         url: `/comments/${videoId}`, // Backend: GET /api/v1/comments/{videoId}
        
//         method: 'GET',
        
//       }),
      
//       providesTags: (result, error, videoId) => [{ type: 'Comment', id: videoId }],
      
//     }),
    

//   }),

// });



// export const { useGetVideoCommentsQuery, useAddCommentMutation } = commentApi;