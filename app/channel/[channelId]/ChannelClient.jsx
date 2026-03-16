"use client";

import { useGetChannelProfileQuery } from "@/store/services/userApi";
import { useGetAllVideosQuery } from "@/store/services/videoApi";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { VideoCard } from "@/components/video/VideoCard";

export function ChannelClient({ channelId }) {
  const { data: profileData, isLoading: profileLoading } = useGetChannelProfileQuery(channelId);
  // Fetch videos specifically for this user
  const { data: videosData, isLoading: videosLoading } = useGetAllVideosQuery({ userId: channelId });

  const channel = profileData?.data;
  const videos = videosData?.data || [];

  if (profileLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-xl sm:h-64" />
        <div className="flex items-center gap-4 px-4 sm:px-8">
          <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Channel not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Cover Image */}
      <div className="h-48 w-full bg-[var(--surface-raised)] sm:h-64 sm:rounded-xl overflow-hidden">
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
        )}
      </div>

      {/* Channel Header Info */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-4">
          <div className="-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[var(--background)] bg-[var(--surface)] sm:-mt-16 sm:h-32 sm:w-32">
            <img 
              src={channel.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
              alt={channel.username}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-2 sm:mt-0">
            <h1 className="text-2xl font-bold">{channel.fullName || channel.username}</h1>
            <p className="text-sm text-[var(--text-muted)]">@{channel.username}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {channel.subscribersCount || 0} subscribers • {channel.channelsSubscribedToCount || 0} subscribed
            </p>
          </div>
        </div>
        <Button className="w-full sm:w-auto rounded-full px-8">Subscribe</Button>
      </div>

      {/* Tabs Section */}
      <div className="px-4 sm:px-8 mt-4">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-[var(--border)] bg-transparent p-0">
            <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Videos
            </TabsTrigger>
            <TabsTrigger value="playlists" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Playlists
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="pt-6">
            {videosLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-xl" />)}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--text-muted)] py-12">This channel has no videos yet.</p>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="pt-6">
            <p className="text-[var(--text-muted)]">Playlists coming soon...</p>
          </TabsContent>

          <TabsContent value="about" className="pt-6">
            <div className="max-w-2xl text-sm">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                {channel.description || "This channel hasn't added a description yet."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}