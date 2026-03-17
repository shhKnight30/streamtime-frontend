"use client";

import { useGetDashboardStatsQuery, useGetDashboardVideosQuery } from "@/store/services/dashboardApi";
import { Eye, Users, Video, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { VideoTable } from "@/components/dashboard/VideoTable";
// import { SubscribersList } from "@/components/dashboard/SubscribersList";
import { NetworkManager } from "@/components/dashboard/NetworkManager";
export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: videosData, isLoading: videosLoading } = useGetDashboardVideosQuery();

  const stats = statsData?.data || {
    totalViews: 0,
    totalSubscribers: 0,
    totalVideos: 0,
    totalLikes: 0,
  };
  
  const videos = videosData?.data?.videos || [];
  console.log(videos)

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channel Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Overview of your channel's performance.</p>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-muted)]">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Eye className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-muted)]">Subscribers</p>
                  <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-muted)]">Total Videos</p>
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                  <Video className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-muted)]">Total Likes</p>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <ThumbsUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Video Management Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Content</h2>
        {videosLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <VideoTable videos={videos} />
          
        )}
      </div>
      {/* ✅ The new SubscribersList section */}
        <div className="space-y-4">
          <NetworkManager/>
        </div>
    </div>
  );
}