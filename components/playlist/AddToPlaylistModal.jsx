"use client";

import { useState } from "react";
import { X, Plus, ListVideo, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useGetUserPlaylistsQuery, useCreatePlaylistMutation, useAddVideoToPlaylistMutation } from "@/store/services/playlistApi";
import { Button } from "../ui/Button";

export function AddToPlaylistModal({ videoId, onClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [savingTo, setSavingTo] = useState(null); // playlistId currently being saved

  const { data, isLoading } = useGetUserPlaylistsQuery();
  const [addVideo] = useAddVideoToPlaylistMutation();
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();

  // Backend returns { data: { playlists: [] } } or { data: [] } — handle both
  const playlists = data?.data?.playlists || data?.data || [];

  const handleAddToPlaylist = async (playlistId) => {
    setSavingTo(playlistId);
    try {
      await addVideo({ playlistId, videoId }).unwrap();
      toast.success("Added to playlist");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add to playlist");
    } finally {
      setSavingTo(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    try {
      const result = await createPlaylist({ name: newPlaylistName.trim() }).unwrap();
      const newId = result?.data?._id || result?.data?.playlist?._id;
      if (newId) {
        await addVideo({ playlistId: newId, videoId }).unwrap();
        toast.success(`Created "${newPlaylistName}" and added video`);
        onClose();
      } else {
        toast.success(`Playlist "${newPlaylistName}" created`);
        onClose();
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create playlist");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Save to playlist</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Playlist list */}
        <div className="max-h-64 overflow-y-auto py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          )}

          {!isLoading && playlists.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)]">
              <ListVideo className="h-8 w-8 opacity-50" />
              <p className="text-sm">No playlists yet</p>
            </div>
          )}

          {!isLoading && playlists.map((playlist) => (
            <button
              key={playlist._id}
              onClick={() => handleAddToPlaylist(playlist._id)}
              disabled={savingTo === playlist._id}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-50"
            >
              <div className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--surface-raised)]">
                {playlist.thumbnail ? (
                  <img src={playlist.thumbnail} alt={playlist.name} className="h-full w-full object-cover" />
                ) : (
                  <ListVideo className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-medium text-[var(--text-primary)]">{playlist.name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {playlist.videoCount ?? playlist.videos?.length ?? 0} videos
                </span>
              </div>
              {savingTo === playlist._id && (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
              )}
            </button>
          ))}
        </div>

        {/* Create new playlist */}
        <div className="border-t border-[var(--border)] p-4">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-500 transition-colors hover:bg-blue-500/10"
            >
              <Plus className="h-4 w-4" />
              New playlist
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setShowCreate(false); setNewPlaylistName(""); }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateAndAdd}
                  disabled={isCreating || !newPlaylistName.trim()}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & add"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}