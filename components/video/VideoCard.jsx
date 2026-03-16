import Link from "next/link";
import { formatTimeAgo, formatViews } from "@/lib/formatters";

export function VideoCard({ video }) {
  return (
    <div className="group flex flex-col gap-3">
      <Link href={`/watch/${video._id}`} className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--surface-raised)]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
            src={video.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.ownerUsername}`}
            alt={video.ownerUsername}
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
            {video.ownerUsername}
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