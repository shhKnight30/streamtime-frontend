"use client";

import { useState } from "react";
import { 
  useGetCurrentUserQuery, 
  useUpdateAvatarMutation, 
  useUpdateCoverImageMutation 
} from "@/store/services/userApi";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

export function ProfileImageSettings() {
  const { data: userResponse, isLoading: isUserLoading } = useGetCurrentUserQuery();
  const user = userResponse?.data;

  const [updateAvatar, { isLoading: isUpdatingAvatar }] = useUpdateAvatarMutation();
  const [updateCover, { isLoading: isUpdatingCover }] = useUpdateCoverImageMutation();

  // Local state for image previews
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  
  // Local state for actual files to upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type & size (e.g., max 5MB)
    if (!file.type.startsWith("image/")) {
      return toast.error("Please select a valid image file.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be less than 5MB.");
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(previewUrl);
    }
  };

  const handleUpload = async (type) => {
    try {
      const formData = new FormData();
      
      if (type === "avatar") {
        formData.append("avatar", avatarFile);
        await updateAvatar(formData).unwrap();
        toast.success("Avatar updated successfully!");
        setAvatarFile(null);
      } else {
        formData.append("coverImage", coverFile);
        await updateCover(formData).unwrap();
        toast.success("Cover image updated successfully!");
        setCoverFile(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || `Failed to update ${type}`);
    }
  };

  if (isUserLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-raised)]" />;
  }

  return (
    <div className="space-y-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      
      {/* --- COVER IMAGE SECTION --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Channel Cover Image</h3>
        <p className="text-sm text-[var(--text-muted)]">
          This image will appear at the top of your channel page. Recommended size: 1920x1080.
        </p>
        
        <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-raised)] group">
          <img 
            src={coverPreview || user?.coverImage || "https://via.placeholder.com/1920x1080?text=No+Cover+Image"} 
            alt="Cover Preview" 
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-50"
          />
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-black/50 p-3 text-white backdrop-blur-sm">
              <ImageIcon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Change Cover</span>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
              onChange={(e) => handleImageChange(e, "cover")}
            />
          </label>
        </div>

        {coverFile && (
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpload("cover")} 
              disabled={isUpdatingCover}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isUpdatingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Cover
            </Button>
          </div>
        )}
      </div>

      <hr className="border-[var(--border)]" />

      {/* --- AVATAR SECTION --- */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Profile Avatar</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Your avatar shows up next to your videos and comments. Recommended: Square image, at least 250x250.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-raised)] group">
            <img 
              src={avatarPreview || user?.avatar || "https://via.placeholder.com/150"} 
              alt="Avatar Preview" 
              className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
            />
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm">
                <Camera className="h-5 w-5" />
              </div>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={(e) => handleImageChange(e, "avatar")}
              />
            </label>
          </div>

          {avatarFile && (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => handleUpload("avatar")} 
                disabled={isUpdatingAvatar}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isUpdatingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Avatar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}