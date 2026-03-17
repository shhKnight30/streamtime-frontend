"use client";

import { useGetUserTimelineQuery, useGetTweetsQuery } from "@/store/services/tweetApi";
import { TweetComposer } from "@/components/tweet/TweetComposer";
import { TweetCard } from "@/components/tweet/TweetCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useState } from "react";

export default function TweetsPage() {
  const [tab, setTab] = useState("timeline"); // "timeline" | "mine"

  const timeline = useGetUserTimelineQuery(undefined, { skip: tab !== "timeline" });
  const mine = useGetTweetsQuery(undefined, { skip: tab !== "mine" });

  const active = tab === "timeline" ? timeline : mine;
  const { data, isLoading, isError } = active;

  // Backend returns { data: { tweets: [] } } or { data: [] } — handle both
  const tweets = data?.data?.tweets || data?.data || [];

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Community Posts</h1>
      </div>

      <div className="flex flex-col gap-6">
        <TweetComposer />

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {[
            { key: "timeline", label: "Following" },
            { key: "mine", label: "Your Posts" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-[var(--border)] p-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
            <p>Failed to load tweets. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && tweets.length > 0 && (
          <div className="flex flex-col gap-4">
            {tweets.map((tweet) => (
              <TweetCard key={tweet._id} tweet={tweet} />
            ))}
          </div>
        )}

        {!isLoading && !isError && tweets.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            <p className="text-sm">
              {tab === "timeline"
                ? "No posts from channels you follow yet."
                : "You haven't posted anything yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}