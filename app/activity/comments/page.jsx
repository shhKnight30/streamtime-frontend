"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useGetUserCommentsQuery } from "@/store/services/historyApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatTimeAgo } from "@/lib/formatters";

export default function CommentsHistoryPage() {
  const { data, isLoading, isError } = useGetUserCommentsQuery();
  const comments = data?.data || [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Your Comments
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">A history of comments you have posted across StreamTime.</p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        )}

        {isError && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
            <p>Failed to load comments. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && comments.length > 0 && comments.map((comment) => (
          <div key={comment._id} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 transition-colors hover:bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.video && (
                <Link 
                  href={`/watch/${comment.video._id}`} 
                  className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
                >
                  Go to video <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {comment.content}
            </p>
          </div>
        ))}

        {!isLoading && !isError && comments.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            <MessageSquare className="mb-4 h-8 w-8 opacity-50" />
            <p>You haven't posted any comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}