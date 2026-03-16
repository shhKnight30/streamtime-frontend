"use client";

import { formatTimeAgo, formatViews } from "@/lib/formatters";
import { useDeleteVideoMutation } from "@/store/services/dashboardApi";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

export function VideoTable({ videos }) {
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video? This cannot be undone.")) return;
    
    try {
      await deleteVideo(videoId).unwrap();
      toast.success("Video deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete video");
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        No videos uploaded yet.
      </div>
    );
  }

  return (
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
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                  {video.isPublished ? "Published" : "Draft"}
                </span>
              </td>
              <td className="p-4 text-[var(--text-muted)]">{formatTimeAgo(video.createdAt)}</td>
              <td className="p-4 text-[var(--text-muted)]">{formatViews(video.views || 0)}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
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
  );
}