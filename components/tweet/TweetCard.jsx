"use client";

import { formatTimeAgo } from "@/lib/formatters";
import { MessageSquare, ThumbsUp, MoreVertical } from "lucide-react";
import { Button } from "../ui/Button";
import { useToggleLikeMutation } from "@/store/services/likeApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";

export function TweetCard({ tweet }) {
  const { user } = useSelector((state) => state.auth);
  const [toggleLike] = useToggleLikeMutation();
  
  // Handling backend populate behavior. Fallbacks in case the backend returns nested objects.
  const owner = tweet?.user || {}; 
  const isLiked = tweet.isLiked || false;
  console.log(owner)
  const handleLike = async () => {
    if (!user) return toast.error("Please log in to like this tweet");
    try {
      await toggleLike({ contentId: tweet._id, contentType: 'tweet' }).unwrap();
    } catch (err) {
      toast.error("Failed to like tweet");
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-raised)]/30 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        
        <img
          src={owner.avatar || "https://via.placeholder.com/150"}
          alt={owner.username}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-full object-cover hover:opacity-80 sm:h-12 sm:w-12"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="font-bold text-[var(--text-primary)] hover:underline cursor-pointer">
                {owner.fullname || owner.username || "User"}
              </span>
              <span className="text-sm text-[var(--text-muted)] hidden sm:inline">
                @{owner.username}
              </span>
              <span className="text-sm text-[var(--text-muted)]">•</span>
              <span className="text-sm text-[var(--text-muted)]">
                {formatTimeAgo(tweet.createdAt)}
              </span>
            </div>
            <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-1 whitespace-pre-wrap text-[15px] text-[var(--text-primary)] leading-relaxed">
            {tweet.content}
          </div>

          {tweet.media && tweet.media.length > 0 && (
            <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-[var(--border)]
              ${tweet.media.length === 1 ? 'grid-cols-1' : ''}
              ${tweet.media.length === 2 ? 'grid-cols-2 aspect-[2/1]' : ''}
              ${tweet.media.length === 3 ? 'grid-cols-2 aspect-[2/1]' : ''}
              ${tweet.media.length >= 4 ? 'grid-cols-2 aspect-square' : ''}
            `}>
              {tweet.media.map((mediaItem, index) => (
                <div 
                  key={mediaItem._id || index} 
                  className={`relative w-full h-full bg-[var(--surface-raised)] flex justify-center
                    ${tweet.media.length === 3 && index === 0 ? 'row-span-2' : ''}
                  `}
                >
                  <img 
                    src={mediaItem.url} 
                    alt={`Tweet Media ${index + 1}`} 
                    className={`w-full h-full object-cover ${tweet.media.length === 1 ? 'max-h-96 object-contain bg-black/5' : ''}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm transition-colors hover:text-blue-500 ${isLiked ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}
            >
              <div className="rounded-full p-2 hover:bg-blue-500/10">
                <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="font-medium">{tweet.likesCount || 0}</span>
            </button>

            <button className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-green-500">
              <div className="rounded-full p-2 hover:bg-green-500/10">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-medium">{tweet.commentsCount || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}