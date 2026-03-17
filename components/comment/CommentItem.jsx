"use client";

import { formatTimeAgo } from "@/lib/formatters";
import { ThumbsUp } from "lucide-react";
import { Button } from "../ui/Button";

export function CommentItem({ comment }) {
  return (
    <div className="flex gap-4 text-sm">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
        <img
          src={comment.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`}
          alt={comment.user?.username}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            @{comment.user?.username}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="text-[var(--text-primary)] whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-2 mt-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ThumbsUp className="h-4 w-4 mr-1.5" />
            <span className="text-xs">{comment.replyCount > 0 ? `${comment.replyCount} replies` : "Reply"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}