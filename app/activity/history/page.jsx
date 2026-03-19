"use client";



import { History, Trash2 } from "lucide-react";

import { toast } from "sonner";



import { useGetWatchHistoryQuery, useClearWatchHistoryMutation } from "@/store/services/historyApi";

import { VideoCard } from "@/components/video/VideoCard";

import { Button } from "@/components/ui/Button";

import { Skeleton } from "@/components/ui/Skeleton";



export default function WatchHistoryPage() {

  const { data, isLoading, isError } = useGetWatchHistoryQuery();

  const [clearHistory, { isLoading: isClearing }] = useClearWatchHistoryMutation();



  const watchHistory = data?.data?.videos || [];



  const handleClearHistory = async () => {

    if (!window.confirm("Are you sure you want to clear your watch history? This cannot be undone.")) return;

    try {

      await clearHistory().unwrap();

      toast.success("Watch history cleared");

    } catch (err) {

      toast.error("Failed to clear watch history");

    }

  };



  return (

    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">

        <div>

          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">

            <History className="h-6 w-6" /> Watch History

          </h1>

        </div>

        <Button 

          variant="outline" 

          size="sm" 

          onClick={handleClearHistory}

          disabled={isClearing || watchHistory.length === 0}

          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"

        >

          <Trash2 className="mr-2 h-4 w-4" />

          Clear All Watch History

        </Button>

      </div>



      {isLoading && (

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-xl" />)}

        </div>

      )}



      {isError && (

        <div className="flex h-40 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">

          <p>Failed to load watch history. Please try again later.</p>

        </div>

      )}



      {!isLoading && !isError && watchHistory.length > 0 && (

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          {watchHistory.map((video) => (

            <VideoCard key={video._id} video={video} />

          ))}

        </div>

      )}



      {!isLoading && !isError && watchHistory.length === 0 && (

        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">

          <History className="mb-4 h-8 w-8 opacity-50" />

          <p>You haven't watched any videos yet.</p>

        </div>

      )}

    </div>

  );

}