"use client";

import { useGetVideoByIdQuery } from "@/store/services/videoApi";
import { useSubscribeToChannelMutation, useUnsubscribeFromChannelMutation, useCheckSubscriptionStatusQuery } from "@/store/services/subscriptionApi";
import { useToggleLikeMutation, useCheckIsLikedQuery } from "@/store/services/likeApi";
import { useSelector } from "react-redux";
import { useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth.js";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo, formatViews } from "@/lib/formatters";
import { ThumbsUp, ThumbsDown, Share2, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { CommentSection } from "@/components/comment/CommentSection";
import ViewTracker from "@/components/video/ViewTracker";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";

export function WatchVideoClient({ videoId }) {
    const requireAuth = useRequireAuth();
    
    // ✅ ALL hooks declared at the top — no conditional hooks, no hooks after computations
    const { data, isLoading, isError } = useGetVideoByIdQuery(videoId);
    const { user } = useSelector((state) => state.auth);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [localLikeDelta, setLocalLikeDelta] = useState(null);  // ← moved up
    const [localIsLiked, setLocalIsLiked] = useState(null);      // ← moved up
    
    const video = data?.data;
    const secureVideoURL = video?.videoURL;
    const secureThumbnail = video?.thumbnail;
    
    // ✅ Derived values AFTER all hooks
    const likeCount = localLikeDelta !== null
        ? (video?.likes || 0) + localLikeDelta
        : (video?.likes || 0);
    
    const likeQueryArgs = useMemo(
        () => ({ contentId: videoId, contentType: 'video' }),
        [videoId]
    );
    
    const { data: likeStatus } = useCheckIsLikedQuery(likeQueryArgs, { skip: !user });
    const isLiked = localIsLiked ?? likeStatus?.data?.isLiked;
    
    const { data: subStatus } = useCheckSubscriptionStatusQuery(video?.owner, {
        skip: !video?.owner || !user,
    });
    const isSubscribed = subStatus?.data?.isSubscribed;
    
    const [subscribe, { isLoading: subscribing }] = useSubscribeToChannelMutation();
    const [unsubscribe, { isLoading: unsubscribing }] = useUnsubscribeFromChannelMutation();
    const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
    
    // Handlers
    const handleLike = requireAuth(async () => {
        const currentIsLiked = localIsLiked ?? isLiked;
        setLocalIsLiked(!currentIsLiked);
        setLocalLikeDelta(prev => (prev ?? 0) + (currentIsLiked ? -1 : 1));
        try {
            await toggleLike({ contentId: videoId, contentType: 'video' }).unwrap();
        } catch {
            setLocalIsLiked(null);
            setLocalLikeDelta(null);
            toast.error("Failed to toggle like");
        }
    });
    
    const handleSubscribe = requireAuth(async () => {
        if (!video?.owner) return;
        try {
            if (isSubscribed) await unsubscribe(video.owner).unwrap();
            else await subscribe(video.owner).unwrap();
        } catch {
            toast.error("Action failed");
        }
    });
    
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-8 w-3/4" />
            </div>
        );
    }
    
    if (isError || !video || !secureVideoURL) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl bg-[var(--surface-raised)]">
                <p className="text-[var(--text-muted)]">Video not found or failed to load.</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-4">
            <VideoPlayer
                src={secureVideoURL}
                poster={secureThumbnail}
                title={video.title}
                className="w-full rounded-xl overflow-hidden"
            />
            
            <h1 className="text-xl font-bold sm:text-2xl">{video.title}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                        <img
                            src={video.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.ownerUsername}`}
                            alt={video.ownerUsername}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <h3 className="font-semibold">{video.ownerUsername}</h3>
                    <Button
                        onClick={handleSubscribe}
                        disabled={subscribing || unsubscribing}
                        variant={isSubscribed ? "outline" : "default"}
                        className="ml-2 rounded-full px-6"
                    >
                        {subscribing || unsubscribing ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-full bg-[var(--surface-raised)]">
                        <Button
                            variant="ghost"
                            className={`rounded-none rounded-l-full px-4 ${isLiked ? 'text-blue-500' : ''}`}
                            onClick={handleLike}
                            disabled={liking}
                        >
                            <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                            {likeCount}
                        </Button>
                        <div className="h-5 w-px bg-[var(--border)]" />
                        <Button variant="ghost" className="rounded-none rounded-r-full px-4">
                            <ThumbsDown className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        className="rounded-full bg-[var(--surface-raised)] px-4"
                        onClick={() => {
                            navigator.share?.({ title: video?.title, url: window.location.href })
                                .catch(() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied!");
                                }) ?? (
                                    navigator.clipboard.writeText(window.location.href),
                                    toast.success("Link copied!")
                                );
                        }}
                    >
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    <Button
                        variant="ghost"
                        className="rounded-full bg-[var(--surface-raised)] px-4"
                        onClick={requireAuth(() => setShowPlaylistModal(true))}
                    >
                        <BookmarkPlus className="mr-2 h-4 w-4" /> Save
                    </Button>
                </div>
            </div>
            
            <div className="rounded-xl bg-[var(--surface-raised)] p-4 text-sm">
                <div className="mb-2 font-medium">
                    {formatViews(video.views || 0)} views • {formatTimeAgo(video.createdAt)}
                </div>
                <p className="whitespace-pre-wrap">{video.description}</p>
            </div>
            
            <CommentSection contentId={videoId} contentType="Video" />
            
            {showPlaylistModal && (
                <AddToPlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />
            )}
            
            <ViewTracker videoId={videoId} />
        </div>
    );
}