// app/search/SearchClient.jsx
"use client";

import { useSearchVideosQuery } from "@/store/services/videoApi";  // ← use the new dedicated hook
import { VideoCard } from "@/components/video/VideoCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function SearchClient({ query }) {
    // ← was useGetAllVideosQuery({ query }) — wrong endpoint and wrong param name
    const { data, isLoading, isError } = useSearchVideosQuery(
        { query },
        { skip: !query }
    );

    const videos = data?.data?.videos || [];

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <h1 className="mb-6 text-xl font-bold tracking-tight">
                Search results for &quot;{query}&quot;
            </h1>

            {isLoading && (
                <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-3">
                            <Skeleton className="aspect-video w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
                    <p>Failed to load search results. Please try again later.</p>
                </div>
            )}

            {!isLoading && !isError && videos.length > 0 && (
                <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            )}

            {!isLoading && !isError && videos.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center text-[var(--text-muted)]">
                    <p>No videos found for &quot;{query}&quot;.</p>
                </div>
            )}
        </div>
    );
}