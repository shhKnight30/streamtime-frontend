"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { formatTimeAgo } from "@/lib/formatters";
import { ThumbsUp, MessageSquare, Trash2, MoreVertical } from "lucide-react";
import { Button } from "../ui/Button";
import { useDeleteTweetMutation } from "@/store/services/tweetApi";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";

export function TweetCard({ tweet }) {
    const { user } = useSelector((state) => state.auth);
    const [deleteTweet, { isLoading: isDeleting }] = useDeleteTweetMutation();

    const isOwner = user?._id === tweet?.user?._id;

    const handleDelete = async () => {
        if (!window.confirm("Delete this tweet?")) return;
        try {
            await deleteTweet(tweet._id).unwrap();
            toast.success("Tweet deleted");
        } catch (err) {
            toast.error("Failed to delete tweet");
        }
    };

    return (
        <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <Link href={`/channel/${tweet.user?.username}`} className="shrink-0">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                    <img
                        src={tweet.user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                        alt={tweet.user?.username}
                        className="h-full w-full object-cover"
                    />
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={`/channel/${tweet.user?.username}`}>
                            <span className="font-semibold text-[var(--text-primary)] hover:underline">
                                {tweet.user?.fullname || tweet.user?.username}
                            </span>
                        </Link>
                        <span className="text-sm text-[var(--text-muted)]">@{tweet.user?.username}</span>
                        <span className="text-sm text-[var(--text-muted)]">·</span>
                        <span className="text-sm text-[var(--text-muted)]">{formatTimeAgo(tweet.createdAt)}</span>
                    </div>

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-muted)]">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-500 focus:text-red-500">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <p className="whitespace-pre-wrap text-[var(--text-primary)]">{tweet.content}</p>

                <div className="mt-2 flex items-center gap-6">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--text-muted)] hover:text-blue-500">
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        <span className="text-xs">{tweet.likesCount || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--text-muted)] hover:text-green-500">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="text-xs">Reply</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}