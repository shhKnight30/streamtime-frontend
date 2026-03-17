"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ListVideo, Plus } from "lucide-react";

import { useGetUserPlaylistsQuery, useCreatePlaylistMutation } from "@/store/services/playlistApi";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
const playlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

export default function PlaylistsPage() {
  const { user } = useSelector((state) => state.auth);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const requireAuth = useRequireAuth()
  // Skip the query if user is not loaded yet to prevent API errors
  const { data, isLoading, isError } = useGetUserPlaylistsQuery(undefined, {
    skip: !user, 
});
  
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();
  const playlists = data?.data?.playlists || data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(playlistSchema),
  });

  const onSubmit = requireAuth(async (formData) => {
    try {
      await createPlaylist(formData).unwrap();
      reset();
      setShowCreateForm(false);
      toast.success("Playlist created successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create playlist.");
    }
  });

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <ListVideo className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Playlists</h1>
            <p className="text-sm text-[var(--text-muted)]">Organize your favorite content</p>
          </div>
        </div>
        
        <Button onClick={() => setShowCreateForm(!showCreateForm)} variant={showCreateForm ? "outline" : "default"}>
          {showCreateForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> New Playlist</>}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-6 max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Playlist Name</label>
              <Input 
                {...register("name")} 
                placeholder="e.g., Coding Tutorials" 
                className="mt-1 bg-[var(--surface)]"
                disabled={isCreating}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isCreating} size="sm">
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && playlists.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist._id} playlist={playlist} />
          ))}
        </div>
      )}

      {!isLoading && !isError && playlists.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
          <ListVideo className="mb-4 h-8 w-8 opacity-50" />
          <p>You haven't created any playlists yet.</p>
        </div>
      )}
    </div>
  );
}