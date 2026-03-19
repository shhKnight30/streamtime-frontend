"use client";

import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Video, X, CheckCircle, AlertCircle, FileVideo, Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useUploadVideoMutation } from "@/store/services/videoApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
// File size limits matching backend spec
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB (updated from 2MB)
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/x-m4v', 'video/*'];
const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Category options from backend API spec
const VIDEO_CATEGORIES = [
  'entertainment',
  'education',
  'news',
  'gaming',
  'music',
  'technology',
  'business',
  'lifestyle',
  'sports',
  'cooking',
  'travel',
  'fitness',
  'science',
  'art',
  'comedy',
  'other'
];

// Visibility options from backend API spec
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view' },
  { value: 'private', label: 'Private', description: 'Only you can view' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with link can view' }
];

// Enhanced validation schema matching backend API spec
const uploadSchema = z.object({
  title: z.string()
    .min(1, "Title is required") // Backend requires minLength: 1
    .max(100, "Title is too long")
    .trim(),
  description: z.string()
    .max(5000, "Description is too long") // Updated from 500 to 5000
    .optional(),
  visibility: z.enum(['public', 'private', 'unlisted'])
    .default('public'),
  tags: z.string()
    .optional(),
  category: z.enum(VIDEO_CATEGORIES)
    .default('entertainment'),
});

export default function UploadPage() {
  const router = useRouter();
  const [uploadVideoFile, { isLoading }] = useUploadVideoMutation();
  const requireAuth = useRequireAuth();
  // Local state for files and UI
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs for file inputs
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(uploadSchema),
  });

  // File validation helpers
  const validateVideoFile = (file) => {
    if (!file) return "Please select a video file.";

    if (file.size > MAX_VIDEO_SIZE) {
      return `Video file size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`;
    }

    if (!ALLOWED_VIDEO_TYPES.some(type => file.type.includes(type.split('/')[1]))) {
      return "Please select a valid video file (MP4, WebM, or OGG).";
    }

    return null;
  };

  const validateThumbnailFile = (file) => {
    if (!file) return null; // Optional - backend generates if not provided

    if (file.size > MAX_THUMBNAIL_SIZE) {
      return `Thumbnail file size must be less than ${MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB.`;
    }

    if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, or WebP).";
    }

    return null;
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    if (type === 'video') {
      const error = validateVideoFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setVideoFile(file);
    } else if (type === 'thumbnail') {
      const error = validateThumbnailFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }, []);

  // File input handlers
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setVideoFile(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateThumbnailFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = (async (data) => {
    
    if (!videoFile) {
      toast.error("Please select a video file.");
      return;
    }
    // Construct FormData for multipart/form-data backend processing
    const formData = new FormData();
    formData.append("videoFile", videoFile);
    formData.append("title", data.title.trim());
    if (data.description?.trim()) formData.append("description", data.description.trim());
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile); // Optional - backend generates if not provided
    formData.append("visibility", data.visibility || 'public');
    if (data.tags?.trim()) formData.append("tags", data.tags.trim());
    formData.append("category", data.category || 'entertainment');

    try {
      // Simulate upload progress (in a real app, this would come from the upload API)
      setUploadProgress(10);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Send to backend
      await uploadVideoFile(formData).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Video uploaded successfully!");
      router.push("/"); // Redirect to home or dashboard
    } catch (err) {
      setUploadProgress(0);
      const errorMessage = err?.data?.message || "Failed to upload video. Please try again.";
      toast.error(errorMessage);
    }
  })

  const removeVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">Share your amazing content with the StreamTime community</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading your video...
                </div>
                <div className="w-full bg-[var(--surface-raised)] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{uploadProgress}% complete</p>
              </div>
            )}

            {/* Video File Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileVideo className="h-5 w-5 text-blue-500" />
                <label className="text-lg font-semibold">Video File</label>
                <span className="text-red-500">*</span>
              </div>

              <div
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : videoFile
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface)]'
                } py-16 px-6`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'video')}
                onClick={() => videoInputRef.current?.click()}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={handleVideoChange}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  disabled={isLoading}
                />

                <div className="flex flex-col items-center gap-4 text-center">
                  {videoFile ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-8 w-8" />
                        <span className="font-medium">Video selected</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-medium text-[var(--text-primary)]">{videoFile.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">{formatFileSize(videoFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVideo();
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <Video className={`h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                      <div className="space-y-2">
                        <p className={`font-medium ${isDragOver ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}>
                          {isDragOver ? 'Drop your video here' : 'Click or drag video to upload'}
                        </p>
                        <div className="text-sm text-[var(--text-muted)] space-y-1">
                          <p>MP4, WebM or OGG (Max 100MB)</p>
                          <p>High-quality videos get more views!</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-500" />
                <label className="text-lg font-semibold">Thumbnail</label>
                <span className="text-sm text-[var(--text-muted)]">(Optional)</span>
              </div>

              <div className="flex gap-6 items-start">
                {/* Thumbnail Preview/Upload Area */}
                <div
                  className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
                    thumbnailFile
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface)]'
                  } w-48 h-32`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'thumbnail')}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    disabled={isLoading}
                  />

                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <ImageIcon className="h-8 w-8 text-[var(--text-muted)]" />
                      <span className="text-sm font-medium">Upload Image</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)]">Thumbnail Guidelines</h4>
                    <ul className="text-sm text-[var(--text-muted)] space-y-1 mt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Recommended size: 1280x720px (16:9)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        File formats: JPEG, PNG, WebP
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Maximum size: 5MB
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Clear, high-contrast images work best
                      </li>
                    </ul>
                  </div>

                  {thumbnailFile && (
                    <div className="flex items-center justify-between bg-[var(--surface-raised)] p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{thumbnailFile.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">({formatFileSize(thumbnailFile.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeThumbnail}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-lg font-semibold flex items-center gap-2">
                Title
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Add a catchy title that describes your video"
                {...register("title")}
                disabled={isLoading}
                className="text-base"
              />
              {errors.title && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title.message}
                </p>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                Your title should be descriptive and engaging to attract viewers.
              </p>
            </div>

            {/* Description Input */}
            <div className="space-y-3">
              <label className="text-lg font-semibold">Description</label>
              <textarea
                placeholder="Tell viewers about your video... What inspired you? What's the story behind it?"
                {...register("description")}
                disabled={isLoading}
                className="flex min-h-[120px] w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description.message}
                </p>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                Detailed descriptions help viewers understand your content and improve search rankings.
              </p>
            </div>

            {/* Visibility Selection */}
            <div className="space-y-3">
              <label className="text-lg font-semibold">Visibility</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VISIBILITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 hover:bg-[var(--surface)] ${
                      watch("visibility") === option.value ? 'border-blue-500 bg-blue-500/5' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register("visibility")}
                      disabled={isLoading}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="font-medium text-[var(--text-primary)]">{option.label}</span>
                        <span className="text-sm text-[var(--text-muted)]">{option.description}</span>
                      </span>
                    </span>
                    <span className={`pointer-events-none absolute -inset-px rounded-lg ${watch("visibility") === option.value ? 'border-2 border-blue-500' : ''}`} />
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-3">
              <label className="text-lg font-semibold">Tags</label>
              <Input
                placeholder="Add tags separated by commas (e.g., tutorial, programming, web-development)"
                {...register("tags")}
                disabled={isLoading}
                className="text-base"
              />
              <p className="text-xs text-[var(--text-muted)]">
                Tags help viewers discover your video. Separate multiple tags with commas.
              </p>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-lg font-semibold">Category</label>
              <select
                {...register("category")}
                disabled={isLoading}
                className="flex h-12 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {VIDEO_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-[var(--surface)] text-[var(--text-primary)]">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-muted)]">
                Choose the category that best describes your video content.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-[var(--border)]">
              <Button
                type="submit"
                disabled={isLoading || !videoFile}
                className="px-8 py-3 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Publishing Video...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Publish Video
                  </>
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}