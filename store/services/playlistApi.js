import { baseApi } from './baseApi';



export const playlistApi = baseApi.injectEndpoints({

  endpoints: (builder) => ({

    getUserPlaylists: builder.query({

      query: (userId) => ({

        url: `/playlists/user/${userId}`, // Adjust to match your Express route

        method: 'GET',

      }),

      providesTags: ['Playlist'],

    }),

    getPlaylistById: builder.query({

      query: (playlistId) => ({

        url: `/playlists/${playlistId}`,

        method: 'GET',

      }),

      providesTags: (result, error, id) => [{ type: 'Playlist', id }],

    }),

    createPlaylist: builder.mutation({

      query: (data) => ({

        url: '/playlists',

        method: 'POST',

        data, // { name, description }

      }),

      invalidatesTags: ['Playlist'],

    }),

  }),

});



export const { 

  useGetUserPlaylistsQuery, 

  useGetPlaylistByIdQuery, 

  useCreatePlaylistMutation 

} = playlistApi;