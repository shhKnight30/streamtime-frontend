"use client";

import { useState, useRef } from "react";
import { useCreateTweetMutation } from "@/store/services/tweetApi";
import { useSelector } from "react-redux";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

export function TweetComposer() {
  const { user } = useSelector((state) => state.auth);
  const [createTweet, { isLoading }] = useCreateTweetMutation();
  
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // ✅ Now an array
  const [mediaPreviews, setMediaPreviews] = useState([]); // ✅ Now an array
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Optional: Limit to 4 images max
    if (mediaFiles.length + files.length > 4) {
      return toast.error("You can only upload up to 4 images per tweet.");
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image.`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (indexToRemove) => {
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setMediaPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    if (content.trim()) formData.append("content", content);
    
    // ✅ Append multiple files to FormData under the same key 'media'
    mediaFiles.forEach((file) => {
      formData.append("media", file); 
    });

    try {
      await createTweet(formData).unwrap();
      toast.success("Tweet posted!");
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post tweet");
    }
  };

  if (!user) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-shadow focus-within:shadow-md sm:p-5">
      <div className="flex gap-4">
        <img
          src={user.avatar || "https://via.placeholder.com/150"}
          alt="Avatar"
          className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
        />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none bg-transparent pt-2 sm:pt-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            rows={content.split("\n").length > 2 ? content.split("\n").length : 2}
          />

          {/* ✅ Render Grid Previews */}
          {mediaPreviews.length > 0 && (
            <div className={`grid gap-2 mt-2 ${mediaPreviews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {mediaPreviews.map((previewUrl, index) => (
                <div key={index} className="relative inline-block overflow-hidden rounded-xl border border-[var(--border)]">
                  <img src={previewUrl} alt={`Preview ${index}`} className="w-full h-32 object-cover sm:h-48" />
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= 4} // Disable if 4 images selected
                className="rounded-full p-2 text-blue-500 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input
                type="file"
                accept="image/*"
                multiple // ✅ Allows selecting multiple files
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && mediaFiles.length === 0)}
              className="rounded-full bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}