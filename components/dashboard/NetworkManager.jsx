"use client";

import { useGetCurrentUserQuery } from "@/store/services/userApi";
import { useGetChannelSubscribersQuery, useGetUserSubscriptionsQuery } from "@/store/services/subscriptionApi";
import { Users, UserPlus } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import Link from "next/link";

export function NetworkManager() {
  const { data: userResponse } = useGetCurrentUserQuery();
  const userId = userResponse?.data?._id;

  // 1. Fetch people following you (Followers)
  const { data: followersResponse, isLoading: loadingFollowers } = useGetChannelSubscribersQuery(userId, {
    skip: !userId,
  });

  // 2. Fetch people you are following (Following)
  const { data: followingResponse, isLoading: loadingFollowing } = useGetUserSubscriptionsQuery(undefined, {
    skip: !userId,
  });

  const followers = followersResponse?.data?.subscribers || [];
  const following = followingResponse?.data?.subscribers || [];

  const UserRow = ({ userProfile, type }) => {
    if (!userProfile) return null;
    return (
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-colors hover:border-blue-500/30">
        <img
          src={userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
          alt={userProfile.username}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex-1 overflow-hidden">
          <h4 className="truncate font-semibold text-[var(--text-primary)]">
            {userProfile.fullname || userProfile.channelName || userProfile.username}
          </h4>
          <p className="truncate text-sm text-[var(--text-muted)]">
            @{userProfile.username || "user"}
          </p>
        </div>
        <Link href={`/channel/${userProfile.username}`}>
          <Button variant={type === "following" ? "outline" : "ghost"} size="sm" className="shrink-0 text-blue-500 hover:text-blue-600">
            View Profile
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
        <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Network</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage your followers and the channels you follow</p>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
            <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
          </TabsList>

          {/* FOLLOWERS TAB */}
          <TabsContent value="followers">
            {loadingFollowers ? (
              <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : followers.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>No followers yet. Keep creating great content!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {followers.map((sub) => (
                  <UserRow key={sub._id} userProfile={sub.subscriber} type="follower" />
                ))}
              </div>
            )}
          </TabsContent>

          {/* FOLLOWING TAB */}
          <TabsContent value="following">
            {loadingFollowing ? (
               <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : following.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <UserPlus className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>You aren't following anyone yet. Go explore!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {following.map((sub) => (
                  <UserRow key={sub._id} userProfile={sub.channel} type="following" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}