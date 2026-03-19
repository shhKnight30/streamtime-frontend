"use client";

import { useState } from "react";
import { formatTimeAgo, formatViews } from "@/lib/formatters";
import { useDeleteVideoMutation } from "@/store/services/dashboardApi";
import { useUpdateVideoMutation } from "@/store/services/videoApi"; // ✅ Imported the update mutation
import { Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

export function VideoTable({ videos }) {
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();

  // ✅ State for Edit Modal
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    isPublished: false,
  });

  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video? This cannot be undone.")) return;
    
    try {
      await deleteVideo(videoId).unwrap();
      toast.success("Video deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete video");
    }
  };

  const handleEditClick = (video) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title || "",
      description: video.description || "",
      isPublished: video.isPublished || false,
    });
  };

  // ✅ Handle Edit Form Submission
  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
        await updateVideo({
            videoId: editingVideo._id,
            formData: {
                title: editForm.title,
                description: editForm.description,
                isPublished: Boolean(editForm.isPublished),  
            }
        }).unwrap()
        toast.success("Video updated successfully")
        setEditingVideo(null)
    } catch (err) {
        toast.error(err?.data?.message || "Failed to update video")
    }
}

  // ✅ Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        No videos uploaded yet.
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)]">
            <tr>
              <th className="p-4 font-medium">Video</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date Uploaded</th>
              <th className="p-4 font-medium">Views</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {videos.map((video) => (
              <tr key={video._id} className="transition-colors hover:bg-[var(--surface-raised)]/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-[var(--surface-raised)]">
                      <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                    </div>
                    <p className="line-clamp-2 max-w-[250px] font-medium text-[var(--text-primary)]">
                      {video.title}
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${video.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {video.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="p-4 text-[var(--text-muted)]">{formatTimeAgo(video.createdAt)}</td>
                <td className="p-4 text-[var(--text-muted)]">{formatViews(video.views || 0)}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditClick(video)} // ✅ Triggers Edit Modal
                      className="h-8 w-8 text-blue-500 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(video._id)}
                      disabled={isDeleting}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Edit Video Modal Overlay */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Video Details</h2>
              <button 
                onClick={() => setEditingVideo(null)}
                className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdate} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Title</label>
                <input 
                  name="title"
                  value={editForm.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter video title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Description</label>
                <textarea 
                  name="description"
                  value={editForm.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter video description"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  name="isPublished"
                  id="isPublished"
                  checked={editForm.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--border)] text-blue-600 focus:ring-blue-500 bg-[var(--surface-raised)]"
                />
                <label htmlFor="isPublished" className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                  Publish Video (Visible to public)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditingVideo(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}