"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { useGetPlaylistByIdQuery, useDeletePlaylistMutation, useRemoveVideoFromPlaylistMutation } from "@/store/services/playlistApi";
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/formatters";
import { Trash2, ListVideo, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PlaylistDetailClient({ playlistId }) {
  const { data, isLoading, isError } = useGetPlaylistByIdQuery(playlistId);
  const { user } = useSelector((state) => state.auth);
  const [deletePlaylist, { isLoading: isDeleting }] = useDeletePlaylistMutation();
  const [removeVideo, { isLoading: isRemoving }] = useRemoveVideoFromPlaylistMutation();
  const [removingVideoId, setRemovingVideoId] = useState(null);
  const router = useRouter();

  const playlist = data?.data;

  // Check if logged-in user is the playlist owner
  const isOwner = user && playlist?.owner && (
    playlist.owner._id === user._id ||
    playlist.owner === user._id
  );

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    try {
      await deletePlaylist(playlistId).unwrap();
      toast.success("Playlist deleted");
      router.push("/playlists");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete playlist");
    }
  };

  const handleRemoveVideo = async (videoId) => {
    setRemovingVideoId(videoId);
    try {
      await removeVideo({ playlistId, videoId }).unwrap();
      toast.success("Video removed from playlist");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove video");
    } finally {
      setRemovingVideoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !playlist) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
        Failed to load playlist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ListVideo className="h-7 w-7 text-[var(--text-muted)]" />
            <h1 className="text-3xl font-bold tracking-tight">{playlist.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-primary)]">
              {playlist.owner?.username || playlist.owner?.fullname}
            </span>
            <span>•</span>
            <span>{playlist.videos?.length || 0} videos</span>
            <span>•</span>
            <span>Updated {formatTimeAgo(playlist.updatedAt)}</span>
          </div>
          {playlist.description && (
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <Button
            variant="ghost"
            onClick={handleDeletePlaylist}
            disabled={isDeleting}
            className="shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete playlist"}
          </Button>
        )}
      </div>

      {/* Videos */}
      {playlist.videos?.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playlist.videos.map((video) => (
            <div key={video._id} className="group relative">
              <VideoCard video={video} />

              {/* Remove button — only visible to owner on hover */}
              {isOwner && (
                <button
                  onClick={() => handleRemoveVideo(video._id)}
                  disabled={removingVideoId === video._id}
                  className="absolute right-2 top-2 hidden items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white transition-opacity hover:bg-red-600 group-hover:flex disabled:opacity-50"
                >
                  {removingVideoId === video._id ? (
                    <span>Removing...</span>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Remove
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
          <ListVideo className="mb-3 h-8 w-8 opacity-50" />
          <p className="text-sm">No videos in this playlist yet.</p>
          {isOwner && (
            <p className="mt-1 text-xs">Save videos from the watch page to add them here.</p>
          )}
        </div>
      )}
    </div>
  );
}