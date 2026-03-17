"use client";

import { useGetCurrentUserQuery } from "@/store/services/userApi";
import { useGetChannelSubscribersQuery } from "@/store/services/subscriptionApi";
import { Users } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";

export function SubscribersList() {
  // 1. Get the current logged-in user to grab their channel ID
  const { data: userResponse } = useGetCurrentUserQuery();
  const channelId = userResponse?.data?._id;

  // 2. Fetch subscribers using that channel ID
  // The 'skip' option ensures we don't make the API call until we actually have the channelId
  const { data: subResponse, isLoading } = useGetChannelSubscribersQuery(channelId, {
    skip: !channelId,
  });

  const subscribers = subResponse?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <Skeleton className="h-8 w-48 bg-[var(--surface-raised)]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-[var(--surface-raised)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
        <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Subscribers</h2>
          <p className="text-sm text-[var(--text-muted)]">
            People who are following your channel
          </p>
        </div>
      </div>

      <div className="p-6">
        {subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-[var(--text-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">No subscribers yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
              Keep uploading great videos and sharing your channel to grow your audience!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscribers.map((sub) => {
              // The backend might return populated data slightly differently depending on aggregation,
              // adjusting for common patterns (e.g., sub.subscriber.avatar or sub.avatar)
              const user = sub.subscriber || sub; 
              
              return (
                <div 
                  key={user._id || Math.random()} 
                  className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-colors hover:border-blue-500/30"
                >
                  <img
                    src={user.avatar || "https://via.placeholder.com/150"}
                    alt={user.fullname || "User avatar"}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate font-semibold text-[var(--text-primary)]">
                      {user.fullname || "Anonymous User"}
                    </h4>
                    <p className="truncate text-sm text-[var(--text-muted)]">
                      @{user.username || "username"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-blue-500 hover:text-blue-600">
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}