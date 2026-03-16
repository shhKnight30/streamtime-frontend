"use client";

import { useGetVideoByIdQuery } from "@/store/services/videoApi";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo, formatViews } from "@/lib/formatters";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
// import { CommentSection } from "@/components/comment/CommentSection";

export function WatchVideoClient({ videoId }) {
  const { data, isLoading, isError } = useGetVideoByIdQuery(videoId);
  
  const video = data?.data;

  // 1. FORCE HTTPS: Browsers will block 'http://' video streams. 
  // We must convert the S3 links to 'https://' before giving them to ReactPlayer.
  const secureVideoURL = video?.videoURL?.replace('http://', 'https://');
  const secureThumbnail = video?.thumbnail?.replace('http://', 'https://');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  // 2. Added a check to ensure we actually have a videoURL before trying to render the player
  if (isError || !video || !secureVideoURL) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-[var(--surface-raised)]">
        <p className="text-[var(--text-muted)]">Video not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video Player */}
      <VideoPlayer 
        src={secureVideoURL}     // <-- Using the secured URL
        poster={secureThumbnail} // <-- Using the secured thumbnail
        title={video.title}
        onPlay={() => console.log("Video started playing")}
        onPause={() => console.log("Video paused")}
        onEnded={() => console.log("Video ended")}
        onProgress={(progress) => console.log("Progress:", progress)}
        onDuration={(duration) => console.log("Duration:", duration)}
        className="w-full aspect-video"
      />

      {/* Video Title & Meta */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{video.title}</h1>
      </div>

      {/* Action Row: Channel Info & Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        
        {/* Channel Details */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <img 
              src={video.ownerAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
              alt={video.ownerUsername} 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{video.ownerUsername}</h3>
            <p className="text-xs text-[var(--text-muted)]">1.2M subscribers</p>
          </div>
          <Button className="ml-2 rounded-full px-6">Subscribe</Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <Button variant="ghost" className="rounded-none rounded-l-full px-4 hover:bg-[var(--surface)]">
              <ThumbsUp className="mr-2 h-4 w-4" />
              {video.likes || 0}
            </Button>
            <div className="h-5 w-[1px] bg-[var(--border)]"></div>
            <Button variant="ghost" className="rounded-none rounded-r-full px-4 hover:bg-[var(--surface)]">
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" className="rounded-full bg-[var(--surface-raised)] px-4 hover:bg-[var(--surface)]">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Description Box */}
      <div className="rounded-xl bg-[var(--surface-raised)] p-4 text-sm">
        <div className="mb-2 font-medium">
          {formatViews(video.views || 0)} views • {formatTimeAgo(video.createdAt)}
        </div>
        <p className="whitespace-pre-wrap">{video.description}</p>
      </div>
      {/* <CommentSection videoId={videoId} /> */}
    </div>
  );
}