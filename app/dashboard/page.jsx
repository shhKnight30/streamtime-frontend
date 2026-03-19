// app/dashboard/page.jsx — CORRECT VERSION
"use client";

import { useGetDashboardStatsQuery, useGetDashboardVideosQuery } from "@/store/services/dashboardApi";
import { useGetUserAnalyticsQuery } from "@/store/services/analyticsApi";
import { VideoTable } from "@/components/dashboard/VideoTable";
import { NetworkManager } from "@/components/dashboard/NetworkManager";
import UserAnalyticsOverview from "@/components/analytics/UserAnalyticsOverview";
import { Skeleton } from "@/components/ui/Skeleton";
import { Video, Eye, ThumbsUp, Users } from "lucide-react";

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: videosData, isLoading: videosLoading } = useGetDashboardVideosQuery();

  const stats = statsData?.data;
  const videos = videosData?.data?.videos || [];

  const statCards = [
    { label: "Total Videos",      value: stats?.totalVideos,      icon: Video,    color: "text-blue-500",   bg: "bg-blue-500/10" },
    { label: "Total Views",        value: stats?.totalViews,        icon: Eye,      color: "text-green-500",  bg: "bg-green-500/10" },
    { label: "Total Likes",        value: stats?.totalLikes,        icon: ThumbsUp, color: "text-pink-500",   bg: "bg-pink-500/10" },
    { label: "Total Subscribers",  value: stats?.totalSubscribers,  icon: Users,    color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creator Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">Overview of your channel performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) =>
          statsLoading ? (
            <Skeleton key={label} className="h-28 rounded-xl" />
          ) : (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className={`inline-flex rounded-full p-2 ${bg} mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm text-[var(--text-muted)]">{label}</p>
              <p className="text-2xl font-bold mt-1">{value?.toLocaleString() ?? 0}</p>
            </div>
          )
        )}
      </div>

      <UserAnalyticsOverview />

      {/* Video Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold">Your Videos</h2>
        </div>
        <div className="p-6">
          {videosLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <VideoTable videos={videos} />
          )}
        </div>
      </div>

      <NetworkManager />
    </div>
  );
}