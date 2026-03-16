"use client";

import { useGetTweetsQuery } from "@/store/services/tweetApi";
import { TweetComposer } from "@/components/tweet/TweetComposer";
import { TweetCard } from "@/components/tweet/TweetCard";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TweetsPage() {
  const { data, isLoading, isError } = useGetTweetsQuery();
  const tweets = data?.data || [];

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Community Posts</h1>
        <p className="text-sm text-[var(--text-muted)]">Updates from channels you follow</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Composer section */}
        <TweetComposer />

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-[var(--border)] p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
            <p>Failed to load tweets. Please try again later.</p>
          </div>
        )}

        {/* Tweets Feed */}
        {!isLoading && !isError && tweets.length > 0 && (
          <div className="flex flex-col gap-4">
            {tweets.map((tweet) => (
              <TweetCard key={tweet._id} tweet={tweet} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && tweets.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            <p>No tweets to show. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}