// app/channel/[channelId]/ChannelClient.jsx
"use client";

import { useGetChannelProfileQuery } from "@/store/services/userApi";
import { useGetAllVideosQuery } from "@/store/services/videoApi";
import { useCheckSubscriptionStatusQuery, useSubscribeToChannelMutation, useUnsubscribeFromChannelMutation } from "@/store/services/subscriptionApi";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useGetUserVideosQuery } from "@/store/services/userApi";
import { VideoCard } from "@/components/video/VideoCard";

export function ChannelClient({ channelId }) {
    // channelId here is actually the username passed from the URL
    const { user: currentUser } = useSelector((state) => state.auth);

    const { data: profileData, isLoading: profileLoading } = useGetChannelProfileQuery(channelId);
    // ← Fetch videos by ownerUsername filter — getAllVideos doesn't support userId
    // but the Video documents have ownerUsername as a flat field
    // We'll filter client-side after getting all videos, OR add a backend query param
    // For now: pass ownerUsername to searchVideos
    const { data: videosData ,isLoading: videosLoading} = useGetUserVideosQuery(
        { ownerUsername: channelId }, // channelId is actually username
        { skip: !channelId }
      );
    const videos = videosData?.data?.videos || [];
    const channel = profileData?.data;

    // Only check subscription if we have the channel's _id
    const { data: subStatus } = useCheckSubscriptionStatusQuery(channel?._id, {
        skip: !channel?._id || !currentUser,
    });
    const isSubscribed = subStatus?.data?.isSubscribed;

    const [subscribe, { isLoading: subscribing }] = useSubscribeToChannelMutation();
    const [unsubscribe, { isLoading: unsubscribing }] = useUnsubscribeFromChannelMutation();

    // Filter videos belonging to this channel
    // const videos = allVideos.filter(v => v.ownerUsername === channel?.username);

    const handleSubscribeToggle = async () => {
        if (!currentUser) {
            toast.error("Please log in to subscribe");
            return;
        }
        try {
            if (isSubscribed) {
                await unsubscribe(channel._id).unwrap();
                toast.success("Unsubscribed");
            } else {
                await subscribe(channel._id).unwrap();
                toast.success("Subscribed!");
            }
        } catch (err) {
            toast.error(err?.data?.message || "Action failed");
        }
    };

    if (profileLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-48 w-full rounded-xl sm:h-64" />
                <div className="flex items-center gap-4 px-4 sm:px-8">
                    <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    if (!channel) {
        return <div className="p-8 text-center text-[var(--text-muted)]">Channel not found.</div>;
    }

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* Cover Image */}
            <div className="h-48 w-full bg-[var(--surface-raised)] sm:h-64 sm:rounded-xl overflow-hidden">
                {channel.coverImage ? (
                    <img src={channel.coverImage} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
                )}
            </div>

            <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-center gap-4">
                    <div className="-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[var(--background)] bg-[var(--surface)] sm:-mt-16 sm:h-32 sm:w-32">
                        <img
                            src={channel.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                            alt={channel.username}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="mt-2 sm:mt-0">
                        {/* ← was channel.fullName — backend returns fullname */}
                        <h1 className="text-2xl font-bold">{channel.fullname || channel.username}</h1>
                        <p className="text-sm text-[var(--text-muted)]">@{channel.username}</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            {channel.subscribersCount || 0} subscribers
                            {/* ← was channelsSubscribedToCount (extra s) */}
                            • {channel.channelSubscribedToCount || 0} subscribed
                        </p>
                    </div>
                </div>

                {/* ← Subscribe button now has handler */}
                {currentUser?._id !== channel._id && (
                    <Button
                        onClick={handleSubscribeToggle}
                        disabled={subscribing || unsubscribing}
                        variant={isSubscribed ? "outline" : "default"}
                        className="w-full sm:w-auto rounded-full px-8"
                    >
                        {subscribing || unsubscribing ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-8 mt-4">
                <Tabs defaultValue="videos" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b border-[var(--border)] bg-transparent p-0">
                        <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                            Videos
                        </TabsTrigger>
                        <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                            About
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="videos" className="pt-6">
                        {videosLoading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-xl" />)}
                            </div>
                        ) : videos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {videos.map((video) => (
                                    <VideoCard key={video._id} video={video} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[var(--text-muted)] py-12">This channel has no videos yet.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="about" className="pt-6">
                        <div className="max-w-2xl text-sm">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                {channel.channelDescription || "This channel hasn't added a description yet."}
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}