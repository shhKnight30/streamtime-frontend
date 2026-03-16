import Link from "next/link";
import { ListVideo, Play } from "lucide-react";
import { formatTimeAgo } from "@/lib/formatters";

export function PlaylistCard({ playlist }) {
  // Use the first video's thumbnail as the cover, or a fallback gradient
  const coverImage = playlist.videos?.[0]?.thumbnail;
  const videoCount = playlist.videos?.length || 0;

  return (
    <div className="group flex flex-col gap-3">
      <Link href={`/playlists/${playlist._id}`} className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--surface-raised)]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={playlist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <ListVideo className="h-12 w-12 text-[var(--text-muted)] opacity-50" />
          </div>
        )}
        
        {/* Overlay showing video count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white transition-opacity group-hover:opacity-0">
          <ListVideo className="h-3 w-3" />
          {videoCount} videos
        </div>

        {/* Hover "Play All" overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
            <Play className="h-4 w-4 fill-white" />
            Play All
          </div>
        </div>
      </Link>

      <div className="flex flex-col overflow-hidden">
        <Link href={`/playlists/${playlist._id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-500">
            {playlist.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Updated {formatTimeAgo(playlist.updatedAt)}
        </p>
      </div>
    </div>
  );
}