import Link from "next/link";
import { formatTimeAgo, formatViews } from "@/lib/formatters";

export function VideoCard({ video }) {
  return (
    <div className="group flex flex-col gap-3">
      {/* Thumbnail */}
      <Link href={`/watch/${video._id}`} className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--surface-raised)]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {/* Format duration (e.g., "10:30"). Handle missing/zero duration gracefully */}
          {video.duration && video.duration > 0 
            ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`
            : 'LIVE'
          }
        </div>
      </Link>

      {/* Video Info */}
      <div className="flex gap-3">
        {/* Channel Avatar */}
        <Link href={`/channel/${video.owner?._id}`} className="shrink-0">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <img
              src={video.owner?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
              alt={video.owner?.username}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>

        {/* Text Details */}
        <div className="flex flex-col overflow-hidden">
          <Link href={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-500">
              {video.title}
            </h3>
          </Link>
          <Link href={`/channel/${video.owner?._id}`}>
            <p className="mt-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {video.owner?.username}
            </p>
          </Link>
          <div className="flex items-center text-xs text-[var(--text-muted)]">
            <span>{formatViews(video.views || 0)} views</span>
            <span className="mx-1">•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}