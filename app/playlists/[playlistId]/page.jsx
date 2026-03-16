import { PlaylistDetailClient } from "./PlaylistDetailClient";

export default async function PlaylistDetailPage({ params }) {
  // Await params as strictly required by Next.js 16
  const { playlistId } = await params;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PlaylistDetailClient playlistId={playlistId} />
    </div>
  );
}