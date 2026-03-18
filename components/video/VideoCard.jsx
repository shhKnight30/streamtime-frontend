import Link from "next/link";
import { formatTimeAgo, formatViews } from "@/lib/formatters";

export function VideoCard({ video,isLive,className }) {
  const displayName = video.ownerUsername || video.streamer?.username || video.streamer?.fullName || 'Unknown';
  const displayAvatar = video.ownerAvatar 
    || video.streamer?.avatar 
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  const href = isLive
    ? `/live/${video.roomId || `stream_${video.streamer?._id || video.streamer}`}`
    : `/watch/${video._id}`;
  return (
    <div className="group flex flex-col gap-3">
      <Link href={href} className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--surface-raised)]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isLive && (
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {video.duration != null && Number(video.duration) > 0
            ? (() => {
              const d = Math.round(Number(video.duration));
              const h = Math.floor(d / 3600);
              const m = Math.floor((d % 3600) / 60);
              const s = d % 60;
              return h > 0
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m}:${s.toString().padStart(2, '0')}`;
            })()
            : video.isLive ? 'LIVE' : '--:--'
          }
        </div>
      </Link>

      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
          <img
            src={displayAvatar}
            alt={displayName  }
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col overflow-hidden">
          <Link href={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-500">
              {video.title}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {displayName}
          </p>
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