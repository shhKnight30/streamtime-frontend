"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { useGetCommentsQuery, useAddCommentMutation } from "@/store/services/commentApi";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "../ui/Skeleton";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

// ✅ Now perfectly dynamic for both Videos and Tweets
export function CommentSection({ contentId, contentType = "Video" }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const { data, isLoading, isError } = useGetCommentsQuery({
    parentContentType: contentType,
    parentContentId: contentId,
  });
  const [postComment, { isLoading: isPosting }] = useAddCommentMutation();

  const comments = data?.data?.comments || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (formData) => {
    try {
      await postComment({
        content: formData.content,
        parentContentType: contentType, // Sends 'tweet' or 'video'
        parentContentId: contentId,     // Sends the proper ID
      }).unwrap();
      reset();
      toast.success("Comment added!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post comment");
    }
  };


  return (
    <div className="mt-6 flex flex-col gap-6 border-t border-[var(--border)] pt-6">
      <h3 className="text-lg font-bold">{comments.length} Comments</h3>

      {/* Input */}
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
          <img
            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-2">
          <textarea
            {...register("content")}
            placeholder={isAuthenticated ? "Add a comment..." : "Log in to comment"}
            disabled={!isAuthenticated || isPosting}
            className="w-full resize-none border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[var(--text-primary)] disabled:opacity-50"
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => reset()} disabled={!isAuthenticated || isPosting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!isAuthenticated || isPosting}>
              {isPosting ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-6">
        {isLoading && [...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex flex-col gap-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /></div></div>
        ))}
        {isError && <p className="text-sm text-red-500">Failed to load comments.</p>}
        {!isLoading && !isError && comments.map((comment) => <CommentItem key={comment._id} comment={comment} />)}
        {!isLoading && !isError && comments.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-4">No comments yet. Be the first!</p>}
      </div>
    </div>
  );
}