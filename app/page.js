"use client";

import { useState } from "react";
import { useGetAllVideosQuery } from "@/store/services/videoApi";
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSelector } from "react-redux";
import { Globe, Users, Radio } from "lucide-react"; // Added Radio icon
import { cn } from "@/lib/utils";
import { useGetLiveStreamsQuery } from "@/store/services/liveStreamApi";

export default function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [feedType, setFeedType] = useState("global");

  // 1. Fetch Live Streams (Renamed loading state to avoid conflict)
  const { data: liveData, isLoading: isLiveLoading } = useGetLiveStreamsQuery({ isLive: true });
  const liveStreams = liveData?.data?.streams || liveData?.data || [];
  console.log(liveStreams)
  // 2. Fetch Regular Videos
  const { data, isLoading, isError } = useGetAllVideosQuery({
    ...(feedType === "subscribed" && { feed: "subscribed" })
  });

  const videos = data?.data?.videos || [];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      
      {/* 🔴 LIVE NOW SECTION (Only shows if there are active streams) */}
      {!isLiveLoading && liveStreams.length > 0 && (
        <section className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Live Now
              </h2>
            </div>
          </div>
          
          {/* Horizontal scroll for Live Streams */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {liveStreams.map((stream) => (
              <VideoCard 
                key={stream._id} 
                video={stream} 
                isLive={true} 
                className="border-2 border-red-500/20" 
              />
            ))}
          </div>
          <div className="mt-8 border-b border-[var(--border)]" />
        </section>
      )}

      {/* ✅ FEED TOGGLE SECTION */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {feedType === "global" ? "Recommended for you" : "Your Subscriptions"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {feedType === "global" ? "Discover new content" : "Latest videos from channels you follow"}
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center rounded-lg bg-[var(--surface-raised)] p-1 border border-[var(--border)]">
            <button
              onClick={() => setFeedType("global")}
              className={cn(
                "flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors",
                feedType === "global" 
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Globe className="h-4 w-4" /> Global
            </button>
            <button
              onClick={() => setFeedType("subscribed")}
              className={cn(
                "flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors",
                feedType === "subscribed" 
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Users className="h-4 w-4" /> Following
            </button>
          </div>
        )}
      </div>

      {/* Video Feed Loading/Error/Success states remain the same as your original */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-3 w-[60%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
          <p>Failed to load videos. Please try again later.</p>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]">
          <Users className="h-12 w-12 opacity-20 mb-4" />
          <p className="font-semibold text-lg">No videos found.</p>
          <p className="text-sm">
            {feedType === "subscribed" ? "The channels you follow haven't posted anything yet." : "Be the first to upload!"}
          </p>
        </div>
      )}
    </div>
  );
}