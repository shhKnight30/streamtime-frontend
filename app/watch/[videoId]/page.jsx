import { WatchVideoClient } from './WatchVideoClient';

export default async function WatchVideoPage({ params }) {
  const { videoId } = await params;
  return <WatchVideoClient videoId={videoId} />;
}
