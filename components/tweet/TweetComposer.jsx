// components/tweet/TweetComposer.jsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { useCreateTweetMutation } from "@/store/services/tweetApi";

const tweetSchema = z.object({
    content: z.string().min(1, "Cannot post an empty tweet").max(280, "Tweet is too long"),
});

export function TweetComposer() {
    const { user } = useSelector((state) => state.auth);
    const [createTweet, { isLoading }] = useCreateTweetMutation();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(tweetSchema),
    });

    const onSubmit = async (data) => {
        try {
            // ← Build FormData — backend expects multipart/form-data for tweet/create
            const formData = new FormData();
            formData.append('content', data.content);

            await createTweet(formData).unwrap();
            reset();
            toast.success("Tweet posted!");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to post tweet");
        }
    };

    if (!user) return null;

    return (
        <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                <img
                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                    alt="Your avatar"
                    className="h-full w-full object-cover"
                />
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-3">
                <textarea
                    {...register("content")}
                    placeholder="What's happening?"
                    disabled={isLoading}
                    className="w-full resize-none bg-transparent pt-2 text-lg outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
                    rows={3}
                />
                {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
                <div className="flex items-center justify-end border-t border-[var(--border)] pt-3">
                    <Button type="submit" disabled={isLoading} className="rounded-full px-6">
                        {isLoading ? "Posting..." : "Post"}
                    </Button>
                </div>
            </form>
        </div>
    );
}