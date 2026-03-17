// store/services/playlistApi.js
import { baseApi } from './baseApi.js';


export const playlistApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        // ← Auth-based route, no userId in path
        getUserPlaylists: builder.query({
            query: (params) => ({
                url: '/playlists/u',  // ← was /playlists/user/${userId}
                method: 'GET',
                params,
            }),
            providesTags: ['Playlist'],
        }),

        getAllPlaylists: builder.query({
            query: (params) => ({
                url: '/playlists/all',
                method: 'GET',
                params,
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
                url: '/playlists/create',  // ← was /playlists
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Playlist'],
        }),

        updatePlaylist: builder.mutation({
            query: ({ playlistId, ...data }) => ({
                url: `/playlists/${playlistId}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: ['Playlist'],
        }),

        deletePlaylist: builder.mutation({
            query: (playlistId) => ({
                url: `/playlists/${playlistId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Playlist'],
        }),

        addVideoToPlaylist: builder.mutation({
            query: (data) => ({
                url: '/playlists/add-video',
                method: 'POST',
                data,  // { playlistId, videoId }
            }),
            invalidatesTags: ['Playlist'],
        }),

        removeVideoFromPlaylist: builder.mutation({
            query: (data) => ({
                url: '/playlists/remove-video',
                method: 'POST',
                data,  // { playlistId, videoId }
            }),
            invalidatesTags: ['Playlist'],
        }),
    }),
});

export const {
    useGetUserPlaylistsQuery,
    useGetAllPlaylistsQuery,
    useGetPlaylistByIdQuery,
    useCreatePlaylistMutation,
    useUpdatePlaylistMutation,
    useDeletePlaylistMutation,
    useAddVideoToPlaylistMutation,
    useRemoveVideoFromPlaylistMutation,
} = playlistApi;