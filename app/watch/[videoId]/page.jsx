import { WatchVideoClient } from './WatchVideoClient';

export default async function WatchVideoPage({ params }) {
  const { videoId } = await params;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main video column */}
        <div className="w-full lg:flex-1 min-w-0">
          <WatchVideoClient videoId={videoId} />
        </div>
        {/* Right sidebar — for recommended videos later */}
        {/* <div className="w-full lg:w-96 shrink-0" /> */}
      </div>
    </div>
  );
}