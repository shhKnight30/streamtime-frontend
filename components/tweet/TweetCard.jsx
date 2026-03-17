"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/lib/formatters";
import { MessageSquare, ThumbsUp, Share2, MoreVertical ,Trash2} from "lucide-react";
import { Button } from "../ui/Button";
import { useToggleLikeMutation } from "@/store/services/likeApi";
import { useCheckSubscriptionStatusQuery, useSubscribeToChannelMutation, useUnsubscribeFromChannelMutation } from "@/store/services/subscriptionApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { CommentSection } from "../comment/CommentSection";
import { useDeleteTweetMutation } from "@/store/services/tweetApi";

export function TweetCard({ tweet }) {
  const { user } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [deleteTweet, { isLoading: isDeleting }] = useDeleteTweetMutation();

  const handleDeleteTweet = async () => {
    if (window.confirm("Are you sure you want to delete this tweet? This action cannot be undone.")) {
      try {
        await deleteTweet(tweet._id).unwrap();
        toast.success("Tweet deleted successfully!");
      } catch (err) {
        toast.error(err?.data?.message || "Failed to delete tweet");
      }
    }
  };
  const owner = tweet.user || tweet.owner || {}; 
  const ownerId = typeof owner === "object" ? owner._id : owner;
  const isOwnPost = user?._id === ownerId;

  // Follow Logic
  const { data: subStatus } = useCheckSubscriptionStatusQuery(ownerId, { skip: !ownerId || !user || isOwnPost });
  const isFollowing = subStatus?.data?.isSubscribed;
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeToChannelMutation();
  const [unsubscribe, { isLoading: isUnsubscribing }] = useUnsubscribeFromChannelMutation();

  // Like Logic
  const [toggleLike] = useToggleLikeMutation();
  const isLiked = tweet.isLiked || false; // Note: Ensure backend returns isLiked or use local state

  const handleFollowToggle = async () => {
    if (!user) return toast.error("Please log in to follow");
    try {
      if (isFollowing) {
        await unsubscribe(ownerId).unwrap();
        toast.success(`Unfollowed @${owner.username}`);
      } else {
        await subscribe(ownerId).unwrap();
        toast.success(`Following @${owner.username}`);
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleLike = async () => {
    if (!user) return toast.error("Please log in to like");
    try {
      await toggleLike({ contentId: tweet._id, contentType: 'tweet' }).unwrap();
    } catch (err) {
      toast.error("Failed to like tweet");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/tweets/${tweet._id}`; // Or wherever tweets live
    if (navigator.share) {
      navigator.share({ title: `Tweet by @${owner.username}`, url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <img
          src={owner.avatar || "https://via.placeholder.com/150"}
          alt={owner.username}
          className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">{owner.fullname || owner.username}</span>
              <span className="text-sm text-[var(--text-muted)]">@{owner.username}</span>
              <span className="text-sm text-[var(--text-muted)]">• {formatTimeAgo(tweet.createdAt)}</span>
              
              {/* ✅ Follow Button (Hidden on own posts) */}
              {!isOwnPost && (
                <button 
                  onClick={handleFollowToggle}
                  disabled={isSubscribing || isUnsubscribing}
                  className={`ml-2 text-sm font-bold ${isFollowing ? 'text-[var(--text-muted)] hover:text-red-500' : 'text-blue-500 hover:text-blue-600'}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
            {isOwnPost ? (
  <button 
    onClick={handleDeleteTweet}
    disabled={isDeleting}
    className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-2 disabled:opacity-50"
    title="Delete Tweet"
  >
    <Trash2 className="h-5 w-5" />
  </button>
) : (
  <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2">
    <MoreVertical className="h-5 w-5" />
  </button>
)}
          </div>

          <div className="mt-2 whitespace-pre-wrap text-[15px]">{tweet.content}</div>

          {/* Media Grid logic remains here... */}

          <div className="mt-4 flex items-center gap-6">
            <button onClick={handleLike} className={`flex items-center gap-2 text-sm hover:text-blue-500 ${isLiked ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}>
              <ThumbsUp className="h-4 w-4" /> <span>{tweet.likes || 0}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-green-500">
              <MessageSquare className="h-4 w-4" /> <span>{tweet.commentsCount || 0}</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-purple-500">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* ✅ Dropdown Comment Section */}
          {showComments && (
            <div className="mt-4">
              <CommentSection contentId={tweet._id} contentType="Tweet" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}