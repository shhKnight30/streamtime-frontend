"use client";

import { useGetUserTimelineQuery } from "@/store/services/tweetApi";
import { TweetComposer } from "@/components/tweet/TweetComposer";
import { TweetCard } from "@/components/tweet/TweetCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users } from "lucide-react";

export default function TweetsPage() {
  // Pulling the timeline from the API slice we just reviewed
  const { data: response, isLoading, isError } = useGetUserTimelineQuery();
  
  // Safely grab the array of tweets depending on how your backend wraps it
  const tweets = response?.data?.tweets || []; 

  return (
    <div className="mx-auto max-w-[650px] px-4 py-6 sm:py-8 lg:px-0">
      
      <div className="mb-6 flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Community</h1>
          <p className="text-sm text-[var(--text-muted)]">See what creators are talking about.</p>
        </div>
      </div>

      <div className="mb-6">
        <TweetComposer />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="w-full space-y-2 pt-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-500">
            Failed to load timeline. Please try again later.
          </div>
        ) : tweets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--text-muted)]">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium text-[var(--text-primary)]">It's quiet here...</p>
            <p className="mt-1 text-sm">Subscribe to channels to see their updates here!</p>
          </div>
        ) : (
          tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} />)
        )}
      </div>

    </div>
  );
}