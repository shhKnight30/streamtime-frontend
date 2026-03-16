"use client";

import { useGetPlaylistByIdQuery } from "@/store/services/playlistApi";
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatTimeAgo } from "@/lib/formatters";

export function PlaylistDetailClient({ playlistId }) {
  const { data, isLoading, isError } = useGetPlaylistByIdQuery(playlistId);
  const playlist = data?.data;

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
    return <div className="p-8 text-center text-red-500">Failed to load playlist.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Playlist Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-8">
        <h1 className="text-3xl font-bold tracking-tight">{playlist.name}</h1>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-primary)]">{playlist.owner?.username}</span>
          <span>•</span>
          <span>{playlist.videos?.length || 0} videos</span>
          <span>•</span>
          <span>Updated {formatTimeAgo(playlist.updatedAt)}</span>
        </div>
        {playlist.description && (
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-muted)]">{playlist.description}</p>
        )}
      </div>

      {/* Videos Grid */}
      {playlist.videos?.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playlist.videos.map((video) => (
            // Ensure the backend populates the actual video document within the videos array
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] text-sm">
          No videos have been added to this playlist yet.
        </div>
      )}
    </div>
  );
}